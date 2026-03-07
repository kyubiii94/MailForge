import { NextRequest, NextResponse } from 'next/server';
import { extractBrandDNASchema } from '@/lib/validators';
import { crawlMainPages } from '@/lib/scraping/crawler';
import { extractTypography, extractColorPalette, analyzeVisualStyleFromPages } from '@/lib/scraping/brand-extractor';
import { analyzeEditorialTone, extractKeywords } from '@/lib/ai/claude';
import { db } from '@/lib/db';

export const maxDuration = 60;

/** Message d'erreur lisible pour l'utilisateur, sans exposer la clé API. */
function sanitizeClaudeError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid') && (lower.includes('key') || lower.includes('api') || lower.includes('auth')))
    return 'clé API Anthropic invalide ou manquante. Vérifiez ANTHROPIC_API_KEY dans .env';
  if (lower.includes('rate limit') || lower.includes('overloaded'))
    return 'quota ou limite de requêtes dépassée. Réessayez plus tard.';
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('econnrefused'))
    return 'erreur réseau. Vérifiez votre connexion.';
  if (lower.includes('timeout'))
    return 'délai dépassé. Réessayez.';
  if (lower.includes('model') && (lower.includes('not found') || lower.includes('unknown') || lower.includes('invalid')))
    return 'modèle Claude indisponible. Mettez à jour le code ou réessayez plus tard.';
  // Ne pas renvoyer de message contenant une clé ou token
  if (message.length > 150 || /sk-ant-|api[_-]?key/i.test(message)) return '';
  return message.slice(0, 150);
}

/**
 * POST /api/brand-dna - Extract brand DNA from a website URL.
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key early
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY non configurée. Ajoutez votre clé API Anthropic dans le fichier .env pour activer l\'analyse IA.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = extractBrandDNASchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { siteUrl, workspaceId } = parsed.data;
    const wsId = workspaceId || '00000000-0000-0000-0000-000000000001';
    const warnings: string[] = [];

    // Step 1: Crawl main pages
    console.log(`[BrandDNA] Starting analysis for ${siteUrl}`);
    const pages = await crawlMainPages(siteUrl);
    if (pages.length === 0) {
      return NextResponse.json(
        { error: 'Impossible de crawler le site. Vérifiez l\'URL et réessayez.' },
        { status: 422 }
      );
    }

    if (pages.length === 1) {
      warnings.push('Seule la page d\'accueil a pu être analysée. L\'analyse serait plus précise avec davantage de pages.');
    }

    // Step 2: Extract CSS-based data (typography, colors, visual style)
    const totalCssBlocks = pages.reduce((sum, p) => sum + p.cssContent.length, 0);
    console.log(`[BrandDNA] ${pages.length} pages crawled, ${totalCssBlocks} CSS blocks extracted`);

    if (totalCssBlocks === 0) {
      warnings.push('Aucun CSS n\'a pu être extrait du site. Les couleurs et la typographie sont des estimations par défaut.');
    }

    const typography = extractTypography(pages);
    const colors = extractColorPalette(pages);
    const visualStyle = analyzeVisualStyleFromPages(pages);

    // Step 3: Analyze text content with Claude AI
    let allText = pages.map((p) => p.textContent).join('\n\n').trim();

    if (allText.length < 100) {
      warnings.push('Très peu de texte extrait du site. Le site utilise peut-être du rendu JavaScript (SPA) non supporté par le crawler.');
      // Enrichir avec titres et meta pour donner du contexte à Claude
      const metaContext = pages
        .map((p) => `[Page: ${p.title || p.url}${p.metaDescription ? ` — ${p.metaDescription}` : ''}]`)
        .join('\n');
      allText = (allText ? allText + '\n\n' : '') + (metaContext || 'Contenu non extrait (site probablement en JavaScript / SPA).');
    }

    let editorialTone;
    let keywords;
    let claudeError: string | null = null;

    const runClaude = async () => {
      return Promise.all([
        analyzeEditorialTone(allText),
        extractKeywords(allText),
      ]);
    };

    try {
      console.log(`[BrandDNA] Calling Claude AI for tone + keywords analysis (${allText.length} chars)...`);
      try {
        [editorialTone, keywords] = await runClaude();
      } catch (firstError) {
        console.warn('[BrandDNA] Claude first attempt failed, retrying in 2s...', firstError instanceof Error ? firstError.message : firstError);
        await new Promise((r) => setTimeout(r, 2000));
        [editorialTone, keywords] = await runClaude();
      }
      console.log(`[BrandDNA] Claude AI analysis complete: tone=${editorialTone.tone}, ${keywords.keywords.length} keywords`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[BrandDNA] Claude AI analysis failed:', msg);
      claudeError = sanitizeClaudeError(msg);
      warnings.push(
        claudeError
          ? `L'analyse IA a échoué : ${claudeError}`
          : 'L\'analyse IA (ton éditorial, mots-clés) a échoué. Vérifiez votre clé API Anthropic dans .env et réessayez.'
      );
      editorialTone = {
        tone: 'non analysé',
        style_notes: claudeError
          ? `L'analyse a échoué : ${claudeError}`
          : 'L\'analyse du ton éditorial n\'a pas pu être effectuée. Vérifiez la clé API Anthropic (.env) et les logs du serveur.',
        formality_level: 5,
        energy_level: 5,
      };
      keywords = {
        keywords: [],
        slogans: [],
        lexicalFields: [],
      };
    }

    // Step 4: Save to database
    const brandDNA = db.createBrandDNA({
      workspaceId: wsId,
      siteUrl,
      typography,
      colors,
      editorialTone,
      visualStyle,
      keywords,
      isValidated: false,
    });

    console.log(`[BrandDNA] Analysis complete for ${siteUrl}: ${warnings.length} warnings`);

    return NextResponse.json(
      { ...brandDNA, warnings, pagesAnalyzed: pages.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('[BrandDNA] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur interne lors de l\'extraction de l\'ADN de marque.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/brand-dna?workspaceId=xxx - Get brand DNA for a workspace.
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const brandDNA = db.getBrandDNAByWorkspace(workspaceId);
  if (!brandDNA) {
    return NextResponse.json({ error: 'Brand DNA not found' }, { status: 404 });
  }

  return NextResponse.json(brandDNA);
}

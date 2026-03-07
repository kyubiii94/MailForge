import { NextRequest, NextResponse } from 'next/server';
import { extractBrandDNASchema } from '@/lib/validators';
import { crawlMainPages } from '@/lib/scraping/crawler';
import { extractTypography, extractColorPalette, analyzeVisualStyleFromPages } from '@/lib/scraping/brand-extractor';
import { analyzeEditorialTone, extractKeywords } from '@/lib/ai/gemini';
import { db } from '@/lib/db';

export const maxDuration = 60;

/** Code HTTP ou status de l'erreur API (401, 429, etc.). */
function getErrorStatus(error: unknown): number | undefined {
  const e = error as { status?: number; statusCode?: number; code?: string } | undefined;
  if (e?.status && typeof e.status === 'number') return e.status;
  if (e?.statusCode && typeof e.statusCode === 'number') return e.statusCode;
  return undefined;
}

/** Message d'erreur lisible pour l'utilisateur, sans exposer la clé API. */
function sanitizeLlmError(error: unknown): string {
  const status = getErrorStatus(error);
  if (status === 401) return 'clé API Gemini refusée (invalide ou révoquée). Vérifiez GEMINI_API_KEY dans .env (aistudio.google.com).';
  if (status === 429) return 'quota ou limite de requêtes dépassée. Réessayez dans quelques minutes.';
  if (status === 403) return 'accès refusé (clé ou compte). Vérifiez votre clé Gemini.';
  if (status === 500 || status === 502) return 'serveur Gemini temporairement indisponible. Réessayez plus tard.';

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes('invalid') && (lower.includes('key') || lower.includes('api') || lower.includes('auth')))
    return 'clé API Gemini invalide. Vérifiez GEMINI_API_KEY dans .env (aistudio.google.com).';
  if (lower.includes('rate limit') || lower.includes('overloaded'))
    return 'quota ou limite de requêtes dépassée. Réessayez plus tard.';
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('econnrefused'))
    return 'erreur réseau. Vérifiez votre connexion.';
  if (lower.includes('timeout'))
    return 'délai dépassé. Réessayez.';
  if (lower.includes('model') && (lower.includes('not found') || lower.includes('unknown') || lower.includes('invalid')))
    return 'modèle Gemini indisponible. Réessayez plus tard.';
  if (message.length > 150 || /sk-ant-|api[_-]?key|AIza/i.test(message)) return '';
  return message.slice(0, 150);
}

/**
 * POST /api/brand-dna - Extract brand DNA from a website URL.
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key early (Gemini)
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY non configurée. Ajoutez votre clé API Gemini dans le fichier .env (aistudio.google.com).' },
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
      console.log(`[BrandDNA] Calling Gemini for tone + keywords analysis (${allText.length} chars)...`);
      try {
        [editorialTone, keywords] = await runClaude();
      } catch (firstError) {
        console.warn('[BrandDNA] Gemini first attempt failed, retrying in 2s...', firstError instanceof Error ? firstError.message : firstError);
        await new Promise((r) => setTimeout(r, 2000));
        [editorialTone, keywords] = await runClaude();
      }
      console.log(`[BrandDNA] Gemini analysis complete: tone=${editorialTone.tone}, ${keywords.keywords.length} keywords`);
    } catch (error) {
      const status = getErrorStatus(error);
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[BrandDNA] Gemini analysis failed:', status ? `HTTP ${status}` : '', msg);
      claudeError = sanitizeLlmError(error);
      warnings.push(
        claudeError
          ? `L'analyse IA a échoué : ${claudeError}`
          : 'L\'analyse IA a échoué. Vérifiez GEMINI_API_KEY dans .env et réessayez.'
      );
      editorialTone = {
        tone: 'non analysé',
        style_notes: claudeError
          ? `L'analyse a échoué : ${claudeError}`
          : 'L\'analyse du ton éditorial n\'a pas pu être effectuée. Vérifiez GEMINI_API_KEY dans .env.',
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

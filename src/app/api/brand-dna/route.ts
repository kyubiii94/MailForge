import { NextRequest, NextResponse } from 'next/server';
import { extractBrandDNASchema } from '@/lib/validators';
import { crawlMainPages } from '@/lib/scraping/crawler';
import { extractTypography, extractColorPalette, analyzeVisualStyleFromPages } from '@/lib/scraping/brand-extractor';
import { analyzeEditorialTone, extractKeywords } from '@/lib/ai/claude';
import { db } from '@/lib/db';

export const maxDuration = 60;

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
    const allText = pages.map((p) => p.textContent).join('\n\n');

    if (allText.length < 100) {
      warnings.push('Très peu de texte extrait du site. Le site utilise peut-être du rendu JavaScript (SPA) non supporté par le crawler.');
    }

    let editorialTone;
    let keywords;

    try {
      console.log(`[BrandDNA] Calling Claude AI for tone + keywords analysis (${allText.length} chars)...`);
      [editorialTone, keywords] = await Promise.all([
        analyzeEditorialTone(allText),
        extractKeywords(allText),
      ]);
      console.log(`[BrandDNA] Claude AI analysis complete: tone=${editorialTone.tone}, ${keywords.keywords.length} keywords`);
    } catch (error) {
      console.error('[BrandDNA] Claude AI analysis failed:', error instanceof Error ? error.message : error);
      warnings.push('L\'analyse IA (ton éditorial, mots-clés) a échoué. Vérifiez votre clé API Anthropic et réessayez.');
      editorialTone = {
        tone: 'non analysé',
        style_notes: 'L\'analyse du ton éditorial a échoué. Vérifiez votre clé API Anthropic.',
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

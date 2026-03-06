import { NextRequest, NextResponse } from 'next/server';
import { extractBrandDNASchema } from '@/lib/validators';
import { crawlMainPages } from '@/lib/scraping/crawler';
import { extractTypography, extractColorPalette, analyzeVisualStyleFromPages } from '@/lib/scraping/brand-extractor';
import { analyzeEditorialTone, extractKeywords } from '@/lib/ai/claude';
import { db } from '@/lib/db';

/**
 * POST /api/brand-dna - Extract brand DNA from a website URL.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Step 1: Crawl main pages
    const pages = await crawlMainPages(siteUrl);
    if (pages.length === 0) {
      return NextResponse.json(
        { error: 'Unable to crawl the website. Please check the URL and try again.' },
        { status: 422 }
      );
    }

    // Step 2: Extract CSS-based data (typography, colors, visual style)
    const typography = extractTypography(pages);
    const colors = extractColorPalette(pages);
    const visualStyle = analyzeVisualStyleFromPages(pages);

    // Step 3: Analyze text content with Claude AI
    const allText = pages.map((p) => p.textContent).join('\n\n');

    let editorialTone;
    let keywords;

    try {
      [editorialTone, keywords] = await Promise.all([
        analyzeEditorialTone(allText),
        extractKeywords(allText),
      ]);
    } catch {
      // Fallback if Claude API is unavailable
      editorialTone = {
        tone: 'professionnel',
        style_notes: 'Tone analysis unavailable - please configure ANTHROPIC_API_KEY',
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

    return NextResponse.json(brandDNA, { status: 201 });
  } catch (error) {
    console.error('Brand DNA extraction error:', error);
    return NextResponse.json(
      { error: 'Internal server error during brand DNA extraction' },
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

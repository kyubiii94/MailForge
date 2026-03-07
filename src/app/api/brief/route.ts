import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCampaignDNA } from '@/lib/ai/gemini';
import { crawlMainPages } from '@/lib/scraping/crawler';
import { extractColorPalette, extractTypography } from '@/lib/scraping/brand-extractor';
import type { CampaignBrief } from '@/types';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY non configurée.', hint: 'Ajoutez votre clé API Gemini dans .env ou dans les variables Vercel.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const brief: CampaignBrief = {
      mode: body.mode || 'vague',
      brand: body.brand || '',
      sector: body.sector || '',
      positioning: body.positioning || '',
      objective: body.objective || '',
      audience: body.audience || '',
      ambiance: body.ambiance || '',
      palette: body.palette || '',
      siteUrl: body.siteUrl || undefined,
      extraContent: body.extraContent || undefined,
      constraints: body.constraints || undefined,
    };

    if (!brief.brand || !brief.objective) {
      return NextResponse.json(
        { error: 'Le nom de la marque et l\'objectif sont requis.' },
        { status: 400 }
      );
    }

    let crawledData: { colors?: string; fonts?: string; textContent?: string } | undefined;

    if (brief.mode === 'precise' && brief.siteUrl) {
      try {
        console.log(`[Brief] Crawling ${brief.siteUrl}...`);
        const pages = await crawlMainPages(brief.siteUrl);
        if (pages.length > 0) {
          const colors = extractColorPalette(pages);
          const typography = extractTypography(pages);
          const textContent = pages.map((p) => p.textContent).join('\n').slice(0, 5000);
          crawledData = {
            colors: `primary: ${colors.primary}, secondary: ${colors.secondary}, accent: ${colors.accent}, bg: ${colors.background}, text: ${colors.text}`,
            fonts: `heading: ${typography.headingFont}, body: ${typography.bodyFont}, families: ${typography.families.join(', ')}`,
            textContent,
          };
          console.log(`[Brief] Crawl done: ${pages.length} pages, colors: ${crawledData.colors}`);
        }
      } catch (err) {
        console.warn('[Brief] Crawl failed:', err instanceof Error ? err.message : err);
      }
    }

    console.log('[Brief] Generating campaign DNA via Gemini...');
    const dna = await generateCampaignDNA(brief, crawledData);
    console.log('[Brief] DNA generated:', JSON.stringify(dna).slice(0, 300));

    const campaign = db.createCampaign({
      name: `${brief.brand} — ${brief.objective}`,
      brief,
      dna,
      status: 'dna_ready',
      selectedTemplateTypes: [],
    });

    return NextResponse.json({ campaign });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    console.error('[Brief] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const mode = body.mode || 'vague';

    let crawledData: { colors?: string; fonts?: string; textContent?: string; title?: string; metaDescription?: string } | undefined;

    if (mode === 'precise') {
      const siteUrl = body.siteUrl?.trim();
      if (!siteUrl) {
        return NextResponse.json({ error: 'L\'URL du site est requise en mode analyse.' }, { status: 400 });
      }

      console.log(`[Brief] Mode précis — Crawling ${siteUrl}...`);
      try {
        const pages = await crawlMainPages(siteUrl);
        if (pages.length > 0) {
          const colors = extractColorPalette(pages);
          const typography = extractTypography(pages);
          const textContent = pages.map((p) => p.textContent).join('\n').slice(0, 8000);
          const title = pages[0]?.title || '';
          const metaDescription = pages[0]?.metaDescription || '';
          crawledData = {
            colors: `primary: ${colors.primary}, secondary: ${colors.secondary}, accent: ${colors.accent}, bg: ${colors.background}, text: ${colors.text}`,
            fonts: `heading: ${typography.headingFont}, body: ${typography.bodyFont}, families: ${typography.families.join(', ')}`,
            textContent,
            title,
            metaDescription,
          };
          console.log(`[Brief] Crawl OK: ${pages.length} pages, title: "${title}"`);
        }
      } catch (err) {
        console.warn('[Brief] Crawl failed:', err instanceof Error ? err.message : err);
      }

      const brief: CampaignBrief = {
        mode: 'precise',
        brand: crawledData?.title || new URL(siteUrl).hostname.replace('www.', ''),
        sector: '',
        positioning: '',
        objective: 'Campagne newsletter',
        audience: '',
        ambiance: '',
        palette: crawledData?.colors || '',
        siteUrl,
      };

      console.log('[Brief] Generating campaign DNA from site analysis...');
      const dna = await generateCampaignDNA(brief, crawledData);
      console.log('[Brief] DNA generated:', JSON.stringify(dna).slice(0, 300));

      const campaign = await db.createCampaign({
        name: `${dna.marque.name} — Campagne newsletter`,
        brief,
        dna,
        status: 'dna_ready',
        selectedTemplateTypes: [],
      });

      return NextResponse.json({ campaign });
    }

    const brief: CampaignBrief = {
      mode: 'vague',
      brand: body.brand || '',
      sector: body.sector || '',
      positioning: body.positioning || '',
      objective: body.objective || '',
      audience: body.audience || '',
      ambiance: body.ambiance || '',
      palette: body.palette || '',
      constraints: body.constraints || undefined,
    };

    if (!brief.brand || !brief.objective) {
      return NextResponse.json(
        { error: 'Le nom de la marque et l\'objectif sont requis.' },
        { status: 400 }
      );
    }

    console.log('[Brief] Generating campaign DNA via Gemini...');
    const dna = await generateCampaignDNA(brief);
    console.log('[Brief] DNA generated:', JSON.stringify(dna).slice(0, 300));

    const campaign = await db.createCampaign({
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

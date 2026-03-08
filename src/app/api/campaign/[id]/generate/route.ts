import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMasterTemplate, generateTemplate } from '@/lib/ai/gemini';
import { TEMPLATE_TYPES } from '@/lib/constants';
import { crawlMainPages } from '@/lib/scraping/crawler';
import type { SiteContent } from '@/lib/ai/prompts';

export const maxDuration = 300;

async function fetchSiteContent(siteUrl: string): Promise<SiteContent | null> {
  try {
    const pages = await crawlMainPages(siteUrl);
    const imageUrls = Array.from(
      new Set(pages.flatMap((p) => p.imageUrls).filter((u) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u)))
    ).slice(0, 25);
    const textContent = pages.map((p) => `${p.title || ''}\n${p.textContent}`).join('\n\n').slice(0, 6000);
    return { imageUrls, textContent };
  } catch (err) {
    console.error('[Generate] Crawl for site content failed:', err);
    return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY non configurée.' }, { status: 503 });
  }

  const body = await request.json();
  const selectedTypes: number[] = body.selectedTypes || campaign.selectedTemplateTypes || [1, 2, 3, 4, 8];

  await db.updateCampaign(id, { status: 'generating', selectedTemplateTypes: selectedTypes });
  await db.deleteTemplatesByCampaign(id);

  let siteContent: SiteContent | null = null;
  if (campaign.brief?.siteUrl) {
    console.log(`[Generate] Fetching site content from ${campaign.brief.siteUrl}...`);
    siteContent = await fetchSiteContent(campaign.brief.siteUrl);
    if (siteContent) {
      console.log(`[Generate] Got ${siteContent.imageUrls.length} image URLs, ${siteContent.textContent.length} chars of text`);
    }
  }

  const results: { templateNumber: number; status: string; error?: string }[] = [];

  try {
    const needsMaster = selectedTypes.includes(8) || selectedTypes.some((t) => t !== 8);

    let masterDesignSpecs = '';
    let masterHeadHtml = '';

    if (needsMaster) {
      console.log(`[Generate] Generating master template (#8) for campaign ${id}...`);
      try {
        const masterData = await generateMasterTemplate(campaign.dna, siteContent);

        masterDesignSpecs = JSON.stringify(masterData.designSpecs, null, 2);
        const headMatch = masterData.htmlCode?.match(/<head[\s\S]*?<\/head>/i);
        masterHeadHtml = headMatch ? headMatch[0] : '';

        if (selectedTypes.includes(8)) {
          await db.createTemplate({
            campaignId: id,
            templateNumber: 8,
            templateType: 'Campaign Master Template',
            subjectLine: masterData.subjectLine || '',
            previewText: masterData.previewText || '',
            layoutDescription: masterData.layoutDescription || { structure: '', heroSection: '', bodySections: '', ctaSection: '', footer: '' },
            designSpecs: masterData.designSpecs || { width: '600px', backgroundColor: '#FFFFFF', fontStack: '', headingStyle: '', bodyStyle: '', ctaStyle: '', spacing: '', borderRadius: '', imageTreatment: '' },
            htmlCode: masterData.htmlCode || '',
            mjmlCode: masterData.mjmlCode || '',
            darkModeOverrides: masterData.darkModeOverrides || '',
            accessibilityNotes: masterData.accessibilityNotes || '',
            coherenceTips: masterData.coherenceTips || '',
          });
          results.push({ templateNumber: 8, status: 'ok' });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Generate] Master template failed:', msg);
        results.push({ templateNumber: 8, status: 'error', error: msg });
      }
    }

    const otherTypes = selectedTypes.filter((t) => t !== 8);
    for (const num of otherTypes) {
      const typeInfo = TEMPLATE_TYPES.find((t) => t.number === num);
      if (!typeInfo) continue;

      console.log(`[Generate] Generating template #${num} (${typeInfo.type})...`);
      try {
        const data = await generateTemplate(campaign.dna, masterDesignSpecs, masterHeadHtml, num, siteContent);

        await db.createTemplate({
          campaignId: id,
          templateNumber: num,
          templateType: typeInfo.type,
          subjectLine: data.subjectLine || '',
          previewText: data.previewText || '',
          layoutDescription: data.layoutDescription || { structure: '', heroSection: '', bodySections: '', ctaSection: '', footer: '' },
          designSpecs: data.designSpecs || { width: '600px', backgroundColor: '#FFFFFF', fontStack: '', headingStyle: '', bodyStyle: '', ctaStyle: '', spacing: '', borderRadius: '', imageTreatment: '' },
          htmlCode: data.htmlCode || '',
          mjmlCode: data.mjmlCode || '',
          darkModeOverrides: data.darkModeOverrides || '',
          accessibilityNotes: data.accessibilityNotes || '',
          coherenceTips: data.coherenceTips || '',
        });
        results.push({ templateNumber: num, status: 'ok' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Generate] Template #${num} failed:`, msg);
        results.push({ templateNumber: num, status: 'error', error: msg });
      }
    }

    const successCount = results.filter((r) => r.status === 'ok').length;
    await db.updateCampaign(id, { status: successCount > 0 ? 'generated' : 'dna_ready' });

    const templates = await db.getTemplatesByCampaign(id);
    return NextResponse.json({ results, templates });
  } catch (err) {
    await db.updateCampaign(id, { status: 'dna_ready' });
    const message = err instanceof Error ? err.message : 'Erreur de génération';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

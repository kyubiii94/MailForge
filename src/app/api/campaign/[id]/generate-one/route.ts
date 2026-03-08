import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMasterTemplate, generateTemplate } from '@/lib/ai/gemini';
import { TEMPLATE_TYPES } from '@/lib/constants';
import { crawlMainPages } from '@/lib/scraping/crawler';
import type { SiteContent } from '@/lib/ai/prompts';

export const maxDuration = 60;

async function fetchSiteContent(siteUrl: string): Promise<SiteContent | null> {
  try {
    const pages = await crawlMainPages(siteUrl);
    const imageUrls = Array.from(
      new Set(pages.flatMap((p) => p.imageUrls).filter((u) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u)))
    ).slice(0, 25);
    const textContent = pages.map((p) => `${p.title || ''}\n${p.textContent}`).join('\n\n').slice(0, 6000);
    return { imageUrls, textContent };
  } catch (err) {
    console.error('[GenerateOne] Crawl for site content failed:', err);
    return null;
  }
}

async function resolveSiteUrl(campaign: { brief?: { siteUrl?: string }; clientId?: string | null }): Promise<string | null> {
  if (campaign.brief?.siteUrl) return campaign.brief.siteUrl;
  if (campaign.clientId) {
    const client = await db.getClient(campaign.clientId);
    if (client?.website) return client.website;
  }
  return null;
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }
  await db.deleteTemplatesByCampaign(id);
  return NextResponse.json({ ok: true });
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
  const templateNumber: number = body.templateNumber;
  const masterDesignSpecs: string = body.masterDesignSpecs || '';
  const masterHeadHtml: string = body.masterHeadHtml || '';
  const skipSiteContent: boolean = body.skipSiteContent || false;

  if (typeof templateNumber !== 'number' || templateNumber < 1 || templateNumber > 8) {
    return NextResponse.json({ error: 'templateNumber invalide (1-8)' }, { status: 400 });
  }

  let siteContent: SiteContent | null = null;
  if (!skipSiteContent) {
    const siteUrl = await resolveSiteUrl(campaign);
    if (siteUrl) {
      console.log(`[GenerateOne] Fetching site content from ${siteUrl}...`);
      siteContent = await fetchSiteContent(siteUrl);
      if (siteContent) {
        console.log(`[GenerateOne] Got ${siteContent.imageUrls.length} images, ${siteContent.textContent.length} chars`);
      }
    }
  }

  try {
    if (templateNumber === 8) {
      console.log(`[GenerateOne] Generating master template (#8) for campaign ${id}...`);
      const masterData = await generateMasterTemplate(campaign.dna, siteContent);

      const designSpecs = JSON.stringify(masterData.designSpecs, null, 2);
      const headMatch = masterData.htmlCode?.match(/<head[\s\S]*?<\/head>/i);
      const headHtml = headMatch ? headMatch[0] : '';

      const template = await db.createTemplate({
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

      return NextResponse.json({
        status: 'ok',
        template,
        masterDesignSpecs: designSpecs,
        masterHeadHtml: headHtml,
      });
    }

    const typeInfo = TEMPLATE_TYPES.find((t) => t.number === templateNumber);
    if (!typeInfo) {
      return NextResponse.json({ error: `Type de template #${templateNumber} inconnu` }, { status: 400 });
    }

    console.log(`[GenerateOne] Generating template #${templateNumber} (${typeInfo.type}) for campaign ${id}...`);
    const data = await generateTemplate(campaign.dna, masterDesignSpecs, masterHeadHtml, templateNumber, siteContent);

    const template = await db.createTemplate({
      campaignId: id,
      templateNumber,
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

    return NextResponse.json({ status: 'ok', template });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur de génération';
    console.error(`[GenerateOne] Template #${templateNumber} failed:`, message);
    return NextResponse.json({ status: 'error', templateNumber, error: message }, { status: 500 });
  }
}

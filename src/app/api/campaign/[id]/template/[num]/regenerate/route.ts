import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMasterTemplate, generateTemplate } from '@/lib/ai/gemini';
import { TEMPLATE_TYPES } from '@/lib/constants';
import { crawlMainPages } from '@/lib/scraping/crawler';
import type { SiteContent } from '@/lib/ai/prompts';

export const maxDuration = 120;

async function fetchSiteContent(siteUrl: string): Promise<SiteContent | null> {
  try {
    const pages = await crawlMainPages(siteUrl);
    const imageUrls = Array.from(
      new Set(pages.flatMap((p) => p.imageUrls).filter((u) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u)))
    ).slice(0, 25);
    const textContent = pages.map((p) => `${p.title || ''}\n${p.textContent}`).join('\n\n').slice(0, 6000);
    return { imageUrls, textContent };
  } catch {
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

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string; num: string }> }) {
  const { id, num } = await params;
  const templateNumber = parseInt(num, 10);

  const campaign = await db.getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const typeInfo = TEMPLATE_TYPES.find((t) => t.number === templateNumber);
  if (!typeInfo) {
    return NextResponse.json({ error: 'Numéro de template invalide' }, { status: 400 });
  }

  let siteContent: SiteContent | null = null;
  const siteUrl = await resolveSiteUrl(campaign);
  if (siteUrl) siteContent = await fetchSiteContent(siteUrl);

  try {
    let data;

    if (templateNumber === 8) {
      data = await generateMasterTemplate(campaign.dna, siteContent);
    } else {
      const masterTemplate = await db.getTemplateByCampaignAndNumber(id, 8);
      const masterDesignSpecs = masterTemplate ? JSON.stringify(masterTemplate.designSpecs, null, 2) : '';
      const headMatch = masterTemplate?.htmlCode?.match(/<head[\s\S]*?<\/head>/i);
      const masterHeadHtml = headMatch ? headMatch[0] : '';
      data = await generateTemplate(campaign.dna, masterDesignSpecs, masterHeadHtml, templateNumber, siteContent);
    }

    const existing = await db.getTemplateByCampaignAndNumber(id, templateNumber);
    let template;

    if (existing) {
      template = await db.updateTemplate(existing.id, {
        subjectLine: data.subjectLine || '',
        previewText: data.previewText || '',
        layoutDescription: data.layoutDescription,
        designSpecs: data.designSpecs,
        htmlCode: data.htmlCode || '',
        mjmlCode: data.mjmlCode || '',
        darkModeOverrides: data.darkModeOverrides || '',
        accessibilityNotes: data.accessibilityNotes || '',
        coherenceTips: data.coherenceTips || '',
      });
    } else {
      template = await db.createTemplate({
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
    }

    return NextResponse.json({ template });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur de régénération';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

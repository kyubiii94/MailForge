import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMasterTemplate, generateTemplate } from '@/lib/ai/gemini';
import { TEMPLATE_TYPES } from '@/lib/constants';
import type { SiteContent } from '@/lib/ai/prompts';

export const maxDuration = 60;

async function buildSiteContentFromClient(clientId: string | null | undefined): Promise<SiteContent | null> {
  if (!clientId) return null;
  const client = await db.getClient(clientId);
  if (!client?.siteAnalysis) return null;

  const analysis = client.siteAnalysis;
  const textParts: string[] = [];
  if (client.name) textParts.push(client.name);
  if (client.sector) textParts.push(`Secteur : ${client.sector}`);
  if (client.positioning) textParts.push(`Positionnement : ${client.positioning}`);
  if (analysis.toneOfVoice) textParts.push(`Ton : ${analysis.toneOfVoice}`);
  if (analysis.audience) textParts.push(`Audience : ${analysis.audience}`);
  if (analysis.ambiance) textParts.push(`Ambiance : ${analysis.ambiance}`);
  if (analysis.keywords?.length) textParts.push(`Mots-clés : ${analysis.keywords.join(', ')}`);
  if (analysis.colors) textParts.push(`Couleurs du site : ${analysis.colors}`);
  if (analysis.fonts) textParts.push(`Polices du site : ${analysis.fonts}`);

  return {
    imageUrls: [],
    textContent: textParts.join('\n'),
  };
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string; num: string }> }) {
  const { id, num } = await params;
  const campaignId = typeof id === 'string' ? id.trim().toLowerCase() : id;
  const templateNumber = parseInt(num, 10);

  const campaign = await db.getCampaign(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const typeInfo = TEMPLATE_TYPES.find((t) => t.number === templateNumber);
  if (!typeInfo) {
    return NextResponse.json({ error: 'Numéro de template invalide' }, { status: 400 });
  }

  const siteContent = await buildSiteContentFromClient(campaign.clientId);

  try {
    let data;

    if (templateNumber === 8) {
      data = await generateMasterTemplate(campaign.dna, siteContent);
    } else {
      const masterTemplate = await db.getTemplateByCampaignAndNumber(campaignId, 8);
      const masterDesignSpecs = masterTemplate ? JSON.stringify(masterTemplate.designSpecs, null, 2) : '';
      const headMatch = masterTemplate?.htmlCode?.match(/<head[\s\S]*?<\/head>/i);
      const masterHeadHtml = headMatch ? headMatch[0] : '';
      data = await generateTemplate(campaign.dna, masterDesignSpecs, masterHeadHtml, templateNumber, siteContent);
    }

    const existing = await db.getTemplateByCampaignAndNumber(campaignId, templateNumber);
    let template;

    if (existing) {
      template = await db.updateTemplate(existing.id, {
        subjectLine: data.subjectLine || '',
        previewText: data.previewText || '',
        layoutDescription: data.layoutDescription,
        designSpecs: data.designSpecs,
        htmlCode: data.htmlCode || '',
        mjmlCode: '',
        darkModeOverrides: data.darkModeOverrides || '',
        accessibilityNotes: data.accessibilityNotes || '',
        coherenceTips: data.coherenceTips || '',
      });
    } else {
      template = await db.createTemplate({
        campaignId,
        templateNumber,
        templateType: typeInfo.type,
        subjectLine: data.subjectLine || '',
        previewText: data.previewText || '',
        layoutDescription: data.layoutDescription || { structure: '', heroSection: '', bodySections: '', ctaSection: '', footer: '' },
        designSpecs: data.designSpecs || { width: '600px', backgroundColor: '#FFFFFF', fontStack: '', headingStyle: '', bodyStyle: '', ctaStyle: '', spacing: '', borderRadius: '', imageTreatment: '' },
        htmlCode: data.htmlCode || '',
        mjmlCode: '',
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

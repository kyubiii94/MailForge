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

  if (typeof templateNumber !== 'number' || templateNumber < 1 || templateNumber > 8) {
    return NextResponse.json({ error: 'templateNumber invalide (1-8)' }, { status: 400 });
  }

  const siteContent = templateNumber === 8
    ? await buildSiteContentFromClient(campaign.clientId)
    : null;

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
        mjmlCode: '',
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
    const data = await generateTemplate(campaign.dna, masterDesignSpecs, masterHeadHtml, templateNumber, null);

    const template = await db.createTemplate({
      campaignId: id,
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

    return NextResponse.json({ status: 'ok', template });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur de génération';
    console.error(`[GenerateOne] Template #${templateNumber} failed:`, message);
    return NextResponse.json({ status: 'error', templateNumber, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMasterTemplate, generateTemplate } from '@/lib/ai/gemini';
import { TEMPLATE_TYPES } from '@/lib/constants';
import type { SiteContent } from '@/lib/ai/prompts';

export const maxDuration = 300;

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignId = typeof id === 'string' ? id.trim().toLowerCase() : id;
  const campaign = await db.getCampaign(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY non configurée.' }, { status: 503 });
  }

  const body = await request.json();
  const selectedTypes: number[] = body.selectedTypes || campaign.selectedTemplateTypes || [1, 2, 3, 4, 8];

  await db.updateCampaign(campaignId, { status: 'generating', selectedTemplateTypes: selectedTypes });

  const siteContent = await buildSiteContentFromClient(campaign.clientId);

  const results: { templateNumber: number; status: string; error?: string }[] = [];

  try {
    const needsMaster = selectedTypes.includes(8) || selectedTypes.some((t) => t !== 8);

    let masterDesignSpecs = '';
    let masterHeadHtml = '';

    if (needsMaster) {
      console.log(`[Generate] Generating master template (#8) for campaign ${campaignId}...`);
      try {
        const masterData = await generateMasterTemplate(campaign.dna, siteContent);

        masterDesignSpecs = JSON.stringify(masterData.designSpecs, null, 2);
        const headMatch = masterData.htmlCode?.match(/<head[\s\S]*?<\/head>/i);
        masterHeadHtml = headMatch ? headMatch[0] : '';

        if (selectedTypes.includes(8)) {
          const existing8 = await db.getTemplateByCampaignAndNumber(campaignId, 8);
          const payload = {
            subjectLine: masterData.subjectLine || '',
            previewText: masterData.previewText || '',
            layoutDescription: masterData.layoutDescription || { structure: '', heroSection: '', bodySections: '', ctaSection: '', footer: '' },
            designSpecs: masterData.designSpecs || { width: '600px', backgroundColor: '#FFFFFF', fontStack: '', headingStyle: '', bodyStyle: '', ctaStyle: '', spacing: '', borderRadius: '', imageTreatment: '' },
            htmlCode: masterData.htmlCode || '',
            mjmlCode: '',
            darkModeOverrides: masterData.darkModeOverrides || '',
            accessibilityNotes: masterData.accessibilityNotes || '',
            coherenceTips: masterData.coherenceTips || '',
          };
          if (existing8) await db.updateTemplate(existing8.id, payload);
          else await db.createTemplate({ campaignId, templateNumber: 8, templateType: 'Campaign Master Template', ...payload });
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
        const data = await generateTemplate(campaign.dna, masterDesignSpecs, masterHeadHtml, num, null);

        const payload = {
          subjectLine: data.subjectLine || '',
          previewText: data.previewText || '',
          layoutDescription: data.layoutDescription || { structure: '', heroSection: '', bodySections: '', ctaSection: '', footer: '' },
          designSpecs: data.designSpecs || { width: '600px', backgroundColor: '#FFFFFF', fontStack: '', headingStyle: '', bodyStyle: '', ctaStyle: '', spacing: '', borderRadius: '', imageTreatment: '' },
          htmlCode: data.htmlCode || '',
          mjmlCode: '',
          darkModeOverrides: data.darkModeOverrides || '',
          accessibilityNotes: data.accessibilityNotes || '',
          coherenceTips: data.coherenceTips || '',
        };
        const existing = await db.getTemplateByCampaignAndNumber(campaignId, num);
        if (existing) await db.updateTemplate(existing.id, payload);
        else await db.createTemplate({ campaignId, templateNumber: num, templateType: typeInfo.type, ...payload });
        results.push({ templateNumber: num, status: 'ok' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Generate] Template #${num} failed:`, msg);
        results.push({ templateNumber: num, status: 'error', error: msg });
      }
    }

    const successCount = results.filter((r) => r.status === 'ok').length;
    await db.updateCampaign(campaignId, { status: successCount > 0 ? 'generated' : 'dna_ready' });

    const templates = await db.getTemplatesByCampaign(campaignId);
    return NextResponse.json({ results, templates });
  } catch (err) {
    await db.updateCampaign(campaignId, { status: 'dna_ready' });
    const message = err instanceof Error ? err.message : 'Erreur de génération';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

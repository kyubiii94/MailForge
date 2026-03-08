import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMasterTemplate, generateTemplate } from '@/lib/ai/gemini';
import { TEMPLATE_TYPES } from '@/lib/constants';

export const maxDuration = 120;

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

  try {
    let data;

    if (templateNumber === 8) {
      data = await generateMasterTemplate(campaign.dna);
    } else {
      const masterTemplate = await db.getTemplateByCampaignAndNumber(id, 8);
      const masterDesignSpecs = masterTemplate ? JSON.stringify(masterTemplate.designSpecs, null, 2) : '';
      const headMatch = masterTemplate?.htmlCode?.match(/<head[\s\S]*?<\/head>/i);
      const masterHeadHtml = headMatch ? headMatch[0] : '';
      data = await generateTemplate(campaign.dna, masterDesignSpecs, masterHeadHtml, templateNumber);
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

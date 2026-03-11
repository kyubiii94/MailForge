import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { compileMjml } from '@/lib/email/mjml-compiler';
import { enforceContrast } from '@/lib/email/contrast-checker';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
  const { id, templateId } = await params;
  const campaignId = typeof id === 'string' ? id.trim().toLowerCase() : id;
  const normalizedTemplateId = typeof templateId === 'string' ? templateId.trim().toLowerCase() : templateId;

  const campaign = await db.getCampaign(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const template = await db.getTemplate(normalizedTemplateId);
  if (!template || template.campaignId !== campaignId) {
    const existing = await db.getTemplatesByCampaign(campaignId);
    const existingNumbers = existing.map((t) => t.templateNumber).sort((a, b) => a - b);
    return NextResponse.json(
      {
        error: `Template introuvable`,
        campaignId,
        campaign,
        requestedId: normalizedTemplateId,
        existingTemplateNumbers: existingNumbers,
        existingTemplates: existing.map((t) => ({ id: t.id, templateNumber: t.templateNumber, templateType: t.templateType })),
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ template, campaign });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
  const { id, templateId } = await params;
  const campaignId = typeof id === 'string' ? id.trim().toLowerCase() : id;
  const normalizedTemplateId = typeof templateId === 'string' ? templateId.trim().toLowerCase() : templateId;

  const campaign = await db.getCampaign(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const template = await db.getTemplate(normalizedTemplateId);
  if (!template || template.campaignId !== campaignId) {
    return NextResponse.json({ error: 'Template introuvable' }, { status: 404 });
  }

  await db.deleteTemplate(normalizedTemplateId);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
  const { id, templateId } = await params;
  const campaignId = typeof id === 'string' ? id.trim().toLowerCase() : id;
  const normalizedTemplateId = typeof templateId === 'string' ? templateId.trim().toLowerCase() : templateId;

  const campaign = await db.getCampaign(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const template = await db.getTemplate(normalizedTemplateId);
  if (!template || template.campaignId !== campaignId) {
    return NextResponse.json({ error: 'Template introuvable' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.mjmlSource) {
    return NextResponse.json({ error: 'mjmlSource requis' }, { status: 400 });
  }

  // Compile MJML to HTML
  let { html, errors } = await compileMjml(body.mjmlSource);

  // Enforce contrast on compiled HTML
  const { html: fixedHtml, corrections } = enforceContrast(html);
  html = fixedHtml;
  if (corrections.length > 0) {
    console.log(`[Save] Template ${normalizedTemplateId}: fixed ${corrections.length} contrast issues`);
  }

  // Check size (Gmail limit: 102KB)
  const sizeKb = new TextEncoder().encode(html).length / 1024;
  if (sizeKb > 102) {
    return NextResponse.json(
      { error: `Le HTML compilé fait ${sizeKb.toFixed(1)} Ko, ce qui dépasse la limite Gmail de 102 Ko.` },
      { status: 400 }
    );
  }

  const updated = await db.updateTemplate(normalizedTemplateId, {
    mjmlCode: body.mjmlSource,
    htmlCode: html,
  });

  return NextResponse.json({
    template: updated,
    campaign,
    compilationErrors: errors,
  });
}

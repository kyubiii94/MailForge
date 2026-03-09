import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

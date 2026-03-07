import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = db.getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }
  const templates = db.getTemplatesByCampaign(id);
  return NextResponse.json({ campaign, templates });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = db.getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const body = await request.json();
  const updated = db.updateCampaign(id, {
    ...(body.dna && { dna: body.dna }),
    ...(body.name && { name: body.name }),
    ...(body.selectedTemplateTypes && { selectedTemplateTypes: body.selectedTemplateTypes }),
    ...(body.status && { status: body.status }),
  });

  return NextResponse.json({ campaign: updated });
}

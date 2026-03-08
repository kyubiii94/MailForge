import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await db.getClient(id);
  if (!client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }
  const campaigns = await db.listCampaignsByClient(id);
  return NextResponse.json({ client, campaigns });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.getClient(id);
  if (!existing) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }

  const body = await request.json();
  const updated = await db.updateClient(id, {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.sector !== undefined && { sector: body.sector }),
    ...(body.positioning !== undefined && { positioning: body.positioning }),
    ...(body.website !== undefined && { website: body.website }),
    ...(body.socialLinks !== undefined && { socialLinks: body.socialLinks }),
    ...(body.distribution !== undefined && { distribution: body.distribution }),
    ...(body.toneOfVoice !== undefined && { toneOfVoice: body.toneOfVoice }),
    ...(body.technicalPrefs !== undefined && { technicalPrefs: body.technicalPrefs }),
    ...(body.notes !== undefined && { notes: body.notes }),
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.getClient(id);
  if (!existing) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }
  await db.deleteClient(id);
  return new NextResponse(null, { status: 204 });
}

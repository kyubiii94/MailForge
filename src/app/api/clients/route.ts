import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WORKSPACE_ID } from '@/lib/constants';
export async function GET() {
  const clients = await db.listClients();
  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await db.createClient({
      workspaceId: WORKSPACE_ID,
      name: body.name || '',
      sector: body.sector || '',
      positioning: body.positioning || '',
      website: body.website ?? null,
      socialLinks: body.socialLinks ?? {},
      distribution: body.distribution ?? [],
      toneOfVoice: body.toneOfVoice ?? { style: '', language: [], do: [], dont: [] },
      technicalPrefs: body.technicalPrefs ?? { esp: null, mergeTagsFormat: '', darkMode: false, languages: [] },
      notes: body.notes ?? '',
    });
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la création du client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

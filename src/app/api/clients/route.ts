import { NextRequest, NextResponse } from 'next/server';
import { createClientSchema } from '@/lib/validators';
import { db } from '@/lib/db';

/**
 * POST /api/clients - Create a new client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const client = db.createClient({
      workspaceId: data.workspaceId,
      name: data.name,
      sector: data.sector,
      positioning: data.positioning ?? '',
      website: data.website ?? null,
      socialLinks: data.socialLinks ?? {},
      distribution: data.distribution ?? [],
      toneOfVoice: data.toneOfVoice ?? {
        style: '',
        language: ['fr'],
        do: [],
        dont: [],
      },
      technicalPrefs: data.technicalPrefs ?? {
        esp: null,
        mergeTagsFormat: '*|TAG|*',
        darkMode: true,
        languages: ['fr'],
      },
      notes: data.notes ?? '',
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Client creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/clients?workspaceId=xxx - List clients for a workspace.
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const clients = db.listClients(workspaceId);
  return NextResponse.json(clients);
}

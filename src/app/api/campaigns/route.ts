import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/features/auth/require-session';
import { createCampaignSchema, getPreset } from '@/features/sfmc';

/** Accès Neon runtime uniquement — pas d'export statique au build. */
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    const campaigns = await db.listCampaigns();
    return NextResponse.json({ campaigns }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('[API] List campaigns error:', err);
    return NextResponse.json({ campaigns: [], error: 'Erreur lors du chargement des campagnes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const campaign = await db.createCampaign(parsed.data);

    // Instancie les emails du preset choisi (séquence FSRBO, journey multi-étapes, etc.)
    const preset = getPreset(parsed.data.type);
    const configs = preset.emails();
    let position = 0;
    for (const config of configs) {
      await db.createEmail(campaign.id, config, position);
      position += 1;
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    console.error('[API] Create campaign error:', err);
    return NextResponse.json({ error: 'Erreur lors de la création de la campagne' }, { status: 500 });
  }
}

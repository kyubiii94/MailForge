import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/features/auth/require-session';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    const campaign = await db.getCampaign(params.id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    }
    const emails = await db.listEmailsByCampaign(campaign.id);
    return NextResponse.json({ campaign, emails }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('[API] Get campaign error:', err);
    return NextResponse.json({ error: 'Erreur lors du chargement de la campagne' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    await db.deleteCampaign(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] Delete campaign error:', err);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}

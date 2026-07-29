import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/features/auth/require-session';
import { suggestContent } from '@/features/sfmc';

export const dynamic = 'force-dynamic';

/**
 * Assistant de contenu IA : propose des props éditoriales (jamais de code SFMC).
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    const email = await db.getEmail(params.id);
    if (!email) return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });

    const campaign = await db.getCampaign(email.campaignId);
    const body = await req.json().catch(() => ({}));
    const instructions = typeof body.instructions === 'string' ? body.instructions : '';

    const suggestion = await suggestContent({
      campaignType: campaign?.type ?? 'libre',
      campaignName: campaign?.name ?? '',
      emailName: email.config.name,
      campaignBrief: campaign?.brief ?? '',
      instructions,
    });

    return NextResponse.json({ suggestion });
  } catch (err) {
    console.error('[API] AI suggest error:', err);
    const message = err instanceof Error ? err.message : 'Erreur IA';
    return NextResponse.json({ error: message.slice(0, 300) }, { status: 500 });
  }
}

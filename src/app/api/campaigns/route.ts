import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/features/auth/require-session';
import { createCampaignSchema } from '@/features/sfmc/schemas/campaign';
import { getPreset } from '@/features/sfmc/presets';

/** Accès Neon runtime uniquement — pas d'export statique au build. */
export const dynamic = 'force-dynamic';

function publicDbError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/relation .* does not exist/i.test(message) || /column .* does not exist/i.test(message)) {
    return 'Schéma base de données incomplet. Exécutez npm run db:push (tables sfmc_campaigns / sfmc_emails).';
  }
  if (/DATABASE_URL/i.test(message)) {
    return 'DATABASE_URL manquante ou invalide.';
  }
  if (/ENOTFOUND|ECONNREFUSED|timeout|fetch failed/i.test(message)) {
    return 'Impossible de joindre la base de données Neon. Vérifiez DATABASE_URL (connexion pooled).';
  }
  const cleaned = message.replace(/postgresql:\/\/[^@\s]+@/gi, 'postgresql://***@').slice(0, 240);
  return cleaned || 'Erreur lors de la création de la campagne';
}

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    const campaigns = await db.listCampaigns();
    return NextResponse.json({ campaigns }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('[API] List campaigns error:', err);
    return NextResponse.json({ campaigns: [], error: publicDbError(err) }, { status: 500 });
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
    return NextResponse.json({ error: publicDbError(err) }, { status: 500 });
  }
}

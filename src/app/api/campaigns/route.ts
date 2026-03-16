import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [campaigns, clients] = await Promise.all([
      db.listCampaigns(),
      db.listClients(),
    ]);
    const list = Array.isArray(campaigns) ? campaigns : [];
    const clientById = new Map(
      (Array.isArray(clients) ? clients : []).map((c) => [c.id, c.name])
    );
    const enriched = list.map((c) => ({
      ...c,
      clientName: c.clientId ? clientById.get(c.clientId) ?? null : null,
    }));
    return NextResponse.json(
      { campaigns: enriched },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('[API] List campaigns error:', err);
    return NextResponse.json(
      { campaigns: [], error: 'Erreur lors du chargement des campagnes' },
      { status: 500 }
    );
  }
}

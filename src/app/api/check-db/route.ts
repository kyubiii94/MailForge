import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/check-db — Diagnostic BDD : variable d’env + connexion + nombre de campagnes.
 * À appeler sur Vercel pour vérifier que la même base est utilisée qu’en local.
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const dbUrlSet = Boolean(dbUrl?.trim());
  const isPooled = dbUrlSet && (dbUrl!.includes('-pooler') || dbUrl!.includes('pooler.'));
  const hint = !dbUrlSet
    ? 'DATABASE_URL absente. Ajoutez-la dans Vercel → Settings → Environment Variables (Production + Preview).'
    : !isPooled
      ? 'Conseil Neon : en serverless (Vercel), utilisez l’URL "pooled" (host avec -pooler). Dans le dashboard Neon : Connection string → "Pooled connection".'
      : 'Format OK (pooled).';

  if (!dbUrlSet) {
    return NextResponse.json({
      dbUrlSet: false,
      dbOk: false,
      campaignCount: 0,
      hint,
      nodeVersion: process.version,
    });
  }

  try {
    const campaigns = await db.listCampaigns();
    return NextResponse.json({
      dbUrlSet: true,
      dbOk: true,
      campaignCount: campaigns.length,
      hint,
      firstCampaignIds: campaigns.slice(0, 3).map((c) => c.id),
      nodeVersion: process.version,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      dbUrlSet: true,
      dbOk: false,
      campaignCount: 0,
      hint,
      error: message.slice(0, 400),
      nodeVersion: process.version,
    });
  }
}

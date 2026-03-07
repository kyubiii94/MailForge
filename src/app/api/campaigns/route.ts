import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const campaigns = db.listCampaigns();
  return NextResponse.json({ campaigns });
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/visuals/:campaignId - List visuals for a campaign.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const visuals = db.getVisualsByCampaign(params.campaignId);
  return NextResponse.json(visuals);
}

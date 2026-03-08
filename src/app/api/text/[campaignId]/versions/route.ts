import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/text/:campaignId/versions - List all text versions for a campaign.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const versions = await db.getTextContentsByCampaign(params.campaignId);
  return NextResponse.json(versions);
}

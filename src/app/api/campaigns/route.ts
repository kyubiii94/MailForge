import { NextRequest, NextResponse } from 'next/server';
import { createCampaignSchema } from '@/lib/validators';
import { db } from '@/lib/db';

/**
 * POST /api/campaigns - Create a new campaign.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { workspaceId, clientId, brandDnaId, name, trigger, objective, period } = parsed.data;

    const campaign = db.createCampaign({
      workspaceId,
      clientId,
      brandDnaId,
      name,
      trigger: trigger || null,
      objective: objective || null,
      period: period || null,
      status: 'draft',
      textSource: null,
      visualSource: null,
      designMode: null,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Campaign creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/campaigns?workspaceId=xxx&clientId=xxx - List campaigns.
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');
  const clientId = request.nextUrl.searchParams.get('clientId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  let campaigns = db.listCampaigns(workspaceId);

  // Filter by client if provided
  if (clientId) {
    campaigns = campaigns.filter((c) => c.clientId === clientId);
  }

  return NextResponse.json(campaigns);
}

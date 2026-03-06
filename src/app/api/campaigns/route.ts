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

    const { workspaceId, brandDnaId, name } = parsed.data;

    const campaign = db.createCampaign({
      workspaceId,
      brandDnaId,
      name,
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
 * GET /api/campaigns?workspaceId=xxx - List campaigns for a workspace.
 */
export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const campaigns = db.listCampaigns(workspaceId);
  return NextResponse.json(campaigns);
}

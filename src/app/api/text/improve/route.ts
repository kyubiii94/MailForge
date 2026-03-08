import { NextRequest, NextResponse } from 'next/server';
import { improveTextSchema } from '@/lib/validators';
import { improveEmailDraft } from '@/lib/ai/claude';
import { db } from '@/lib/db';

/**
 * POST /api/text/improve - Improve a draft email using Claude AI (Module 02, Option B).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = improveTextSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { draft, brandDnaId, campaignId, campaignGoal, desiredCTA, targetLength, tone } = parsed.data;

    // Fetch brand DNA
    const brandDNA = await db.getBrandDNA(brandDnaId);
    if (!brandDNA) {
      return NextResponse.json({ error: 'Brand DNA not found' }, { status: 404 });
    }

    // Fetch client if brand DNA has a clientId
    const client = brandDNA.clientId ? await db.getClient(brandDNA.clientId) : undefined;

    // Fetch campaign for trigger info
    const campaign = await db.getCampaign(campaignId);

    // Call Claude AI
    const improved = await improveEmailDraft({
      draft,
      brandDNA,
      client,
      campaignGoal,
      campaignTrigger: campaign?.trigger || undefined,
      desiredCTA: desiredCTA || '',
      targetLength: targetLength || 300,
      tone,
    });

    // Save AI-generated text to database
    const existingVersions = await db.getTextContentsByCampaign(campaignId);
    const version = existingVersions.length + 1;

    const textContent = await db.createTextContent({
      campaignId,
      version,
      subject: improved.subject,
      preheader: improved.preheader,
      headline: improved.headline,
      body: improved.body,
      ctaText: improved.ctaText,
      ctaUrl: '',
      sourceType: 'ai',
    });

    return NextResponse.json(textContent, { status: 201 });
  } catch (error) {
    console.error('Text improvement error:', error);
    return NextResponse.json(
      { error: 'Failed to improve text. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}

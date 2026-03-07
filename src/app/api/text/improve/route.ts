import { NextRequest, NextResponse } from 'next/server';
import { improveTextSchema } from '@/lib/validators';
import { improveEmailDraft } from '@/lib/ai/gemini';
import { db } from '@/lib/db';

/**
 * POST /api/text/improve - Improve a draft email using Gemini AI (Module 02, Option B).
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

    const { draft, brandDnaId, campaignGoal, desiredCTA, targetLength, tone } = parsed.data;

    // Fetch brand DNA
    const brandDNA = db.getBrandDNA(brandDnaId);
    if (!brandDNA) {
      return NextResponse.json({ error: 'Brand DNA not found' }, { status: 404 });
    }

    // Call Gemini AI
    const improved = await improveEmailDraft({
      draft,
      brandDNA,
      campaignGoal,
      desiredCTA: desiredCTA || '',
      targetLength: targetLength || 300,
      tone,
    });

    return NextResponse.json({
      subject: improved.subject,
      preheader: improved.preheader,
      headline: improved.headline,
      body: improved.body,
      ctaText: improved.ctaText,
    });
  } catch (error) {
    console.error('Text improvement error:', error);
    return NextResponse.json(
      { error: 'Failed to improve text. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}

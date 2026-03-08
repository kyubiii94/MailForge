import { NextRequest, NextResponse } from 'next/server';
import { parseTextSchema } from '@/lib/validators';
import { db } from '@/lib/db';

/**
 * POST /api/text/parse - Parse existing text into structured email blocks (Module 02, Option A).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = parseTextSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, campaignId } = parsed.data;

    // Smart text parsing: split into semantic blocks
    const lines = text.split('\n').filter((l) => l.trim());

    // Heuristic: first short line = subject, second = headline, rest = body
    const subject = lines[0]?.slice(0, 60) || 'Votre email';
    const preheader = lines[0]?.slice(0, 100) || '';
    const headline = lines.length > 1 ? lines[1] : lines[0] || '';
    const bodyLines = lines.slice(2);
    const bodyText = bodyLines.length > 0
      ? bodyLines.map((l) => `<p>${l}</p>`).join('\n')
      : `<p>${text}</p>`;

    // Find potential CTA text (last line if it's short)
    const lastLine = lines[lines.length - 1] || '';
    const ctaText = lastLine.length < 40 && lines.length > 3 ? lastLine : 'En savoir plus';

    // Get existing versions count
    const existingVersions = await db.getTextContentsByCampaign(campaignId);
    const version = existingVersions.length + 1;

    const textContent = await db.createTextContent({
      campaignId,
      version,
      subject,
      preheader,
      headline,
      body: bodyText,
      ctaText,
      ctaUrl: '',
      sourceType: 'manual',
    });

    return NextResponse.json(textContent, { status: 201 });
  } catch (error) {
    console.error('Text parse error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromUrlSchema } from '@/lib/validators';
import { extractTextFromUrl } from '@/lib/scraping/crawler';
import { db } from '@/lib/db';

/**
 * POST /api/text/extract - Extract text content from a URL (Module 02, Option C).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = extractTextFromUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url, campaignId } = parsed.data;
    const extracted = await extractTextFromUrl(url);

    // Get existing versions count
    const existingVersions = await db.getTextContentsByCampaign(campaignId);
    const version = existingVersions.length + 1;

    const textContent = await db.createTextContent({
      campaignId,
      version,
      subject: extracted.title.slice(0, 60),
      preheader: extracted.metaDescription.slice(0, 100),
      headline: extracted.title,
      body: `<p>${extracted.content.slice(0, 2000)}</p>`,
      ctaText: 'En savoir plus',
      ctaUrl: url,
      sourceType: 'scraped',
    });

    return NextResponse.json(textContent, { status: 201 });
  } catch (error) {
    console.error('Text extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract text from URL' }, { status: 500 });
  }
}

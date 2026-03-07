import { NextRequest, NextResponse } from 'next/server';
import { generateDesignSchema } from '@/lib/validators';
import { generateEmailDesign } from '@/lib/ai/gemini';
import { compileMjml, calculateDeliverabilityScore } from '@/lib/email/mjml-compiler';
import { db } from '@/lib/db';

/**
 * POST /api/design/generate - Generate email design using AI (Module 04, Option 1).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateDesignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { campaignId, brandDnaId, textContentId, visualIds, variants } = parsed.data;

    // Fetch required data
    const brandDNA = db.getBrandDNA(brandDnaId);
    if (!brandDNA) {
      return NextResponse.json({ error: 'Brand DNA not found' }, { status: 404 });
    }

    const textContent = db.getTextContent(textContentId);
    if (!textContent) {
      return NextResponse.json({ error: 'Text content not found' }, { status: 404 });
    }

    // Get visual URLs
    const visualUrls = (visualIds || [])
      .map((id) => db.getVisual(id))
      .filter(Boolean)
      .map((v) => v!.fileUrl);

    const designs = [];
    const variantCount = variants || 2;

    for (let i = 1; i <= variantCount; i++) {
      try {
        // Generate MJML with Gemini
        const { mjml } = await generateEmailDesign({
          brandDNA,
          textContent: {
            subject: textContent.subject,
            preheader: textContent.preheader,
            headline: textContent.headline,
            body: textContent.body,
            ctaText: textContent.ctaText,
            ctaUrl: textContent.ctaUrl || '#',
          },
          visualUrls,
          variantNumber: i,
        });

        // Compile MJML to HTML
        const { html } = await compileMjml(mjml);

        // Calculate deliverability score
        const score = calculateDeliverabilityScore({
          html,
          subject: textContent.subject,
        });

        const design = db.createEmailDesign({
          campaignId,
          variantNumber: i,
          htmlContent: html,
          mjmlSource: mjml,
          thumbnailUrl: '',
          deliverabilityScore: score,
        });

        designs.push(design);
      } catch (error) {
        console.error(`Error generating variant ${i}:`, error);
        // Continue with other variants
      }
    }

    if (designs.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any email designs. Please check your API key.' },
        { status: 500 }
      );
    }

    // Update campaign status
    db.updateCampaign(campaignId, { status: 'review', designMode: 'ai_generated' });

    return NextResponse.json(designs, { status: 201 });
  } catch (error) {
    console.error('Design generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

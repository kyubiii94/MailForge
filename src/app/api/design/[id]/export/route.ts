import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/design/:id/export - Export email design in various formats.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const format = body.format || 'html';

    const design = await db.getEmailDesign(params.id);
    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    switch (format) {
      case 'html':
        return new NextResponse(design.htmlContent, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="email-design-${design.variantNumber}.html"`,
          },
        });

      case 'mjml':
        return new NextResponse(design.mjmlSource, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="email-design-${design.variantNumber}.mjml"`,
          },
        });

      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use: html, mjml' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

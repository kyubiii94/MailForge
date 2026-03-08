import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; num: string }> }) {
  const { id, num } = await params;
  const templateNumber = parseInt(num, 10);

  const template = await db.getTemplateByCampaignAndNumber(id, templateNumber);
  if (!template) {
    return NextResponse.json({ error: `Template #${templateNumber} non trouvé` }, { status: 404 });
  }

  const format = new URL(_request.url).searchParams.get('format') || 'html';

  if (format === 'mjml') {
    return new NextResponse(template.mjmlCode || '', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="template-${templateNumber}.mjml"`,
      },
    });
  }

  return new NextResponse(template.htmlCode || '', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="template-${templateNumber}.html"`,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
  const { id, templateId } = await params;
  const campaignId = typeof id === 'string' ? id.trim().toLowerCase() : id;
  const normalizedTemplateId = typeof templateId === 'string' ? templateId.trim().toLowerCase() : templateId;

  const template = await db.getTemplate(normalizedTemplateId);
  if (!template || template.campaignId !== campaignId) {
    return NextResponse.json({ error: 'Template introuvable' }, { status: 404 });
  }

  const url = new URL(_request.url);
  const format = url.searchParams.get('format') || 'html';
  const inline = url.searchParams.get('inline') === 'true';

  if (format === 'mjml') {
    return new NextResponse(template.mjmlCode || '', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="template-${template.templateNumber}.mjml"`,
      },
    });
  }

  const disposition = inline
    ? 'inline'
    : `attachment; filename="template-${template.templateNumber}.html"`;

  return new NextResponse(template.htmlCode || '', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': disposition,
    },
  });
}

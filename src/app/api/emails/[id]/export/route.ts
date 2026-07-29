import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/features/auth/require-session';
import { buildExport, type ExportFormat } from '@/features/sfmc';

export const dynamic = 'force-dynamic';

const FORMATS: ExportFormat[] = ['package', 'html', 'ampscript', 'ssjs', 'cloudpage'];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const formatParam = (searchParams.get('format') || 'package') as ExportFormat;
    const format = FORMATS.includes(formatParam) ? formatParam : 'package';
    const download = searchParams.get('download') === '1';

    const email = await db.getEmail(params.id);
    if (!email) return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });

    const result = buildExport(email.config, email.rendered, format);

    if (download) {
      return new NextResponse(result.content, {
        headers: {
          'Content-Type': `${result.mime}; charset=utf-8`,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
        },
      });
    }
    return NextResponse.json({ ...result });
  } catch (err) {
    console.error('[API] Export email error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\u2019export' }, { status: 500 });
  }
}

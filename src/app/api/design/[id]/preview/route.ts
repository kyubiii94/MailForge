import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/design/:id/preview - Get email design preview HTML.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const design = db.getEmailDesign(params.id);
  if (!design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }

  return new NextResponse(design.htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

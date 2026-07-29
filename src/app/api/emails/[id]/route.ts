import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/features/auth/require-session';
import { updateEmailSchema } from '@/features/sfmc';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    const email = await db.getEmail(params.id);
    if (!email) return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
    return NextResponse.json({ email }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('[API] Get email error:', err);
    return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 });
  }
}

/** Met à jour la config → re-render déterministe + QA côté serveur. */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = updateEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }
    const email = await db.updateEmailConfig(params.id, parsed.data.config);
    if (!email) return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
    return NextResponse.json({ email });
  } catch (err) {
    console.error('[API] Update email error:', err);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  try {
    await db.deleteEmail(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] Delete email error:', err);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}

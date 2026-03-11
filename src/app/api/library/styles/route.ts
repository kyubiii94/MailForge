import { NextRequest, NextResponse } from 'next/server';
import { listStyles, createStyle, getStyle, updateStyle, deleteStyle } from '@/lib/library/queries';

export async function GET() {
  try {
    const styles = await listStyles();
    return NextResponse.json(styles);
  } catch (err) {
    console.error('[API] List styles error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Nom du style requis' }, { status: 400 });
    }
    const style = await createStyle({
      name: body.name.trim(),
      description: body.description,
      stylePrompt: body.stylePrompt,
      coverInspirationId: body.coverInspirationId,
      inspirationIds: body.inspirationIds,
    });
    return NextResponse.json(style, { status: 201 });
  } catch (err) {
    console.error('[API] Create style error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const updated = await updateStyle(id, data);
    if (!updated) return NextResponse.json({ error: 'Style introuvable' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API] Update style error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    await deleteStyle(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] Delete style error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

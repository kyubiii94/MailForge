import { NextRequest, NextResponse } from 'next/server';
import { listTags, createTag, updateTag, deleteTag } from '@/lib/library/queries';

export async function GET() {
  try {
    const tags = await listTags();
    return NextResponse.json(tags);
  } catch (err) {
    console.error('[API] List tags error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nom du tag requis' }, { status: 400 });
    }
    const tag = await createTag({ name: name.trim(), color });
    return NextResponse.json(tag, { status: 201 });
  } catch (err) {
    console.error('[API] Create tag error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, name, color } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    const updated = await updateTag(id, { name, color });
    if (!updated) return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API] Update tag error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    await deleteTag(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] Delete tag error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

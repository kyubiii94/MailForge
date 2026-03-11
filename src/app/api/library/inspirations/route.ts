import { NextRequest, NextResponse } from 'next/server';
import { listInspirations, deleteInspiration, getInspiration, updateInspiration } from '@/lib/library/queries';
import { deleteInspirationFile } from '@/lib/library/storage';
import type { LibraryFilters } from '@/types/library';

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const filters: LibraryFilters = {};

    if (params.get('search')) filters.search = params.get('search')!;
    if (params.get('fileType') && params.get('fileType') !== 'all') {
      filters.fileType = params.get('fileType') as 'image' | 'html';
    }
    if (params.get('tags')) filters.tags = params.get('tags')!.split(',');
    if (params.get('styleId')) filters.styleId = params.get('styleId')!;
    if (params.get('sortBy')) filters.sortBy = params.get('sortBy') as LibraryFilters['sortBy'];
    if (params.get('sortOrder')) filters.sortOrder = params.get('sortOrder') as 'asc' | 'desc';
    if (params.get('limit')) filters.limit = parseInt(params.get('limit')!, 10);
    if (params.get('offset')) filters.offset = parseInt(params.get('offset')!, 10);

    const inspirations = await listInspirations(filters);
    return NextResponse.json(inspirations);
  } catch (err) {
    console.error('[API] List inspirations error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const insp = await getInspiration(id);
    if (insp) {
      await deleteInspirationFile(insp.filePath);
      await deleteInspiration(id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API] Delete inspiration error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const updated = await updateInspiration(id, data);
    if (!updated) return NextResponse.json({ error: 'Inspiration introuvable' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[API] Update inspiration error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

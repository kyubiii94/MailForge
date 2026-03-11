import { NextRequest, NextResponse } from 'next/server';
import { createInspiration } from '@/lib/library/queries';
import { uploadInspirationFile, validateFile, getFileType } from '@/lib/library/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const title = (formData.get('title') as string) || file.name.replace(/\.[^.]+$/, '');
    const description = formData.get('description') as string | null;
    const sourceUrl = formData.get('sourceUrl') as string | null;
    const sourceBrand = formData.get('sourceBrand') as string | null;
    const tagIdsRaw = formData.get('tagIds') as string | null;
    const tagIds = tagIdsRaw ? JSON.parse(tagIdsRaw) as string[] : undefined;

    const fileType = getFileType(file.type);

    // Read HTML content if it's an HTML file
    let htmlContent: string | undefined;
    if (fileType === 'html') {
      htmlContent = await file.text();
    }

    const { filePath, thumbnailPath } = await uploadInspirationFile(file);

    const inspiration = await createInspiration({
      title,
      description: description || undefined,
      sourceUrl: sourceUrl || undefined,
      sourceBrand: sourceBrand || undefined,
      fileType,
      filePath,
      thumbnailPath: thumbnailPath || undefined,
      htmlContent,
      tagIds,
    });

    return NextResponse.json(inspiration, { status: 201 });
  } catch (err) {
    console.error('[API] Upload error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
  }
}

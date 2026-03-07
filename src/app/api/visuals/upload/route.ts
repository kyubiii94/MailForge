import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';

/**
 * POST /api/visuals/upload - Upload visual files (Module 03).
 * Stores files as base64 data URLs in the in-memory DB (MVP).
 * Replace with S3/R2 upload in production.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const campaignId = formData.get('campaignId') as string;

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const visuals = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) continue;
      if (file.size > maxSize) continue;

      const fileId = generateId();
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      const visual = db.createVisual({
        campaignId,
        fileUrl: dataUrl,
        fileKey: `${campaignId}/${fileId}`,
        originalFilename: file.name,
        width: 0,
        height: 0,
        fileSize: file.size,
        altText: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        sourceType: 'uploaded',
        isSelected: true,
      });

      visuals.push(visual);
    }

    if (visuals.length === 0) {
      return NextResponse.json(
        { error: 'No valid files uploaded. Accepted formats: JPG, PNG, WebP, GIF (max 10MB)' },
        { status: 400 }
      );
    }

    return NextResponse.json(visuals, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}

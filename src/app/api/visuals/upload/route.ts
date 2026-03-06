import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * POST /api/visuals/upload - Upload visual files (Module 03, Option A).
 * For MVP, stores files locally. Replace with S3/R2 in production.
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

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const visuals = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        continue; // Skip unsupported files
      }
      if (file.size > maxSize) {
        continue; // Skip files that are too large
      }

      const fileId = generateId();
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${fileId}.${ext}`;

      // Save file locally (MVP - replace with S3/R2)
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', campaignId);
      await mkdir(uploadDir, { recursive: true });

      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      const visual = db.createVisual({
        campaignId,
        fileUrl: `/uploads/${campaignId}/${fileName}`,
        fileKey: `${campaignId}/${fileName}`,
        originalFilename: file.name,
        width: 0, // Would extract with sharp in production
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

/**
 * File storage for inspiration uploads using Vercel Blob.
 */

import { put, del } from '@vercel/blob';
import { WORKSPACE_ID } from '@/lib/constants';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/html',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Type de fichier non supporté : ${file.type}. Formats acceptés : PNG, JPG, WebP, HTML` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : 10 MB` };
  }
  return { valid: true };
}

export function getFileType(mimeType: string): 'image' | 'html' {
  return mimeType === 'text/html' ? 'html' : 'image';
}

export async function uploadInspirationFile(file: File): Promise<{ filePath: string; thumbnailPath: string | null }> {
  const prefix = `inspirations/${WORKSPACE_ID}`;
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const pathname = `${prefix}/originals/${timestamp}-${safeName}`;

  const blob = await put(pathname, file, {
    access: 'public',
    contentType: file.type,
  });

  // For images, the original also serves as thumbnail (frontend will use CSS to resize)
  const thumbnailPath = file.type.startsWith('image/') ? blob.url : null;

  return {
    filePath: blob.url,
    thumbnailPath,
  };
}

export async function deleteInspirationFile(filePath: string): Promise<void> {
  try {
    await del(filePath);
  } catch (err) {
    console.error('[Storage] Failed to delete file:', filePath, err);
  }
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a UUID v4 */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Format a date for display */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

/** Truncate text to a maximum length */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/** Convert bytes to human-readable size */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/** Validate hex color */
export function isValidHex(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/** Create a delay promise */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Safe JSON parse */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** 1x1 transparent GIF to avoid broken image requests for invalid img src */
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Sanitize HTML for safe preview in iframe: remove scripts, fix invalid image URLs
 * (e.g. hex codes or relative paths used as src that cause ERR_NAME_NOT_RESOLVED).
 */
export function sanitizeHtmlForPreview(html: string): string {
  if (!html?.trim()) return html;
  let out = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<img\s+([^>]*?)>/gi, (_match, attrs) => {
    const srcMatch = attrs.match(/src\s*=\s*["']([^"']*)["']/i);
    const src = (srcMatch && srcMatch[1]) ? srcMatch[1].trim() : '';
    const isValidUrl = /^(https?:|data:)/i.test(src);
    if (src && !isValidUrl) {
      const newAttrs = attrs.replace(/src\s*=\s*["'][^"']*["']/i, `src="${TRANSPARENT_PIXEL}"`);
      return '<img ' + newAttrs + '>';
    }
    return _match;
  });
  return out;
}

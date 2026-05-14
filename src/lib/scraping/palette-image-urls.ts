import * as cheerio from 'cheerio';
import type { CrawledPage } from './crawler';

/** Patterns whose URLs rarely carry brand palette (icons, tracking, favicons). */
const SKIP_SUBSTR = [
  'favicon',
  'apple-touch-icon',
  'sprite',
  '/icons/',
  '/pixel.gif',
  '/spacer.',
  'tracking',
  'google-analytics',
  'facebook.com/tr',
  'doubleclick',
  'googletagmanager',
  '/logo-small',
  '1x1',
];

function shouldSkipUrl(lower: string): boolean {
  return SKIP_SUBSTR.some((s) => lower.includes(s));
}

/**
 * Pick public image URLs likely to show real brand colors (hero, OG preview, large assets).
 * Used for vision-based palette refinement (CSS alone misses photographic branding).
 */
export function collectPaletteCandidateImageUrls(pages: CrawledPage[], limit = 5): string[] {
  const home = pages[0];
  if (!home?.html) return [];

  let baseOrigin: string;
  try {
    baseOrigin = new URL(home.url).origin;
  } catch {
    return [];
  }

  const $ = cheerio.load(home.html);
  const scored: { url: string; score: number }[] = [];

  const og =
    $('meta[property="og:image"]').attr('content')?.trim() ||
    $('meta[name="twitter:image"]').attr('content')?.trim() ||
    $('meta[name="twitter:image:src"]').attr('content')?.trim();

  if (og && !og.startsWith('data:')) {
    try {
      const full = og.startsWith('http') ? og : new URL(og, baseOrigin).href;
      const low = full.toLowerCase();
      if (!shouldSkipUrl(low)) scored.push({ url: full, score: 1200 });
    } catch {
      /* skip */
    }
  }

  $('img[src], img[data-src]').each((_, el) => {
    const src = $(el).attr('src')?.trim() || $(el).attr('data-src')?.trim();
    if (!src || src.startsWith('data:')) return;
    let full: string;
    try {
      full = src.startsWith('http') ? src : new URL(src, baseOrigin).href;
    } catch {
      return;
    }
    const lower = full.toLowerCase();
    if (shouldSkipUrl(lower)) return;

    let score = 120;
    const w = parseInt($(el).attr('width') || '0', 10);
    const h = parseInt($(el).attr('height') || '0', 10);
    if (w >= 600 || h >= 400) score += 450;
    else if (w >= 350 || h >= 250) score += 280;
    else if (w >= 180 || h >= 120) score += 90;

    const cls = (($(el).attr('class') || '') + ' ' + ($(el).parent().attr('class') || '')).toLowerCase();
    if (/hero|banner|slideshow|carousel|stage|kv|spotlight|fullscreen/i.test(cls)) score += 500;

    const alt = ($(el).attr('alt') || '').trim().length;
    score += Math.min(alt, 40);

    scored.push({ url: full, score });
  });

  for (const u of home.imageUrls || []) {
    if (!u.startsWith('http')) continue;
    const lower = u.toLowerCase();
    if (shouldSkipUrl(lower)) continue;
    if (!scored.some((s) => s.url === u)) scored.push({ url: u, score: 95 });
  }

  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { url } of scored) {
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Vérifie et corrige les contrastes du HTML email généré.
 * Retourne le HTML corrigé + un rapport des corrections appliquées.
 */

interface ContrastCorrection {
  element: string;
  original: string;
  fixed: string;
  ratio: number;
}

/**
 * Parse a hex color (#RGB or #RRGGBB) into [r, g, b].
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace(/^#/, '');
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length === 6) {
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  }
  return null;
}

/**
 * Parse rgb(r, g, b) or rgba(r, g, b, a) to [r, g, b].
 */
function rgbStringToRgb(str: string): [number, number, number] | null {
  const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  return null;
}

/**
 * Parse any CSS color to [r, g, b]. Supports hex, rgb(), and named colors.
 */
const NAMED_COLORS: Record<string, string> = {
  white: '#ffffff', black: '#000000', red: '#ff0000', blue: '#0000ff',
  green: '#008000', gray: '#808080', grey: '#808080', yellow: '#ffff00',
  orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', transparent: '#ffffff',
};

function parseColor(color: string): [number, number, number] | null {
  const c = color.trim().toLowerCase();
  if (c.startsWith('#')) return hexToRgb(c);
  if (c.startsWith('rgb')) return rgbStringToRgb(c);
  if (NAMED_COLORS[c]) return hexToRgb(NAMED_COLORS[c]);
  return null;
}

/**
 * Calculate relative luminance per WCAG 2.1.
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors.
 */
function contrastRatio(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a background is "light" (luminance > 0.5).
 */
function isLightColor(rgb: [number, number, number]): boolean {
  return relativeLuminance(...rgb) > 0.179;
}

/**
 * Best text color for a given background.
 */
function bestTextColor(bgRgb: [number, number, number]): string {
  return isLightColor(bgRgb) ? '#1A1A1A' : '#FFFFFF';
}

/**
 * Extract inline color and background-color pairs from HTML style attributes.
 * Returns matches with their positions for replacement.
 */
interface StyleMatch {
  fullMatch: string;
  startIndex: number;
  textColor: string | null;
  bgColor: string | null;
  elementTag: string;
}

function extractStylePairs(html: string): StyleMatch[] {
  const results: StyleMatch[] = [];

  // Match elements with style attributes
  const regex = /<(\w+)\s[^>]*style\s*=\s*"([^"]*)"/gi;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(html)) !== null) {
    const tag = m[1];
    const styleStr = m[2];

    // Extract color
    const colorMatch = styleStr.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    // Extract background-color
    const bgMatch = styleStr.match(/background-color\s*:\s*([^;]+)/i);

    if (colorMatch || bgMatch) {
      results.push({
        fullMatch: m[0],
        startIndex: m.index,
        textColor: colorMatch ? colorMatch[1].trim() : null,
        bgColor: bgMatch ? bgMatch[1].trim() : null,
        elementTag: tag,
      });
    }
  }

  return results;
}

/**
 * Walk up the HTML to find a background-color from ancestor elements.
 * Simple heuristic: look at preceding elements with bgcolor or background-color.
 */
function findAncestorBgColor(html: string, position: number): string | null {
  const preceding = html.substring(Math.max(0, position - 2000), position);

  // Check for bgcolor attribute (common in email HTML)
  let lastBgcolor: string | null = null;
  const bgcolorRegex = /bgcolor\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = bgcolorRegex.exec(preceding)) !== null) {
    lastBgcolor = m[1];
  }
  if (lastBgcolor) return lastBgcolor;

  // Check for background-color in style
  let lastBgStyle: string | null = null;
  const bgStyleRegex = /background-color\s*:\s*([^;"]+)/gi;
  while ((m = bgStyleRegex.exec(preceding)) !== null) {
    lastBgStyle = m[1].trim();
  }
  if (lastBgStyle) return lastBgStyle;

  return null;
}

const MIN_CONTRAST_RATIO = 4.5;

/**
 * Enforce contrast rules on generated HTML email.
 * Scans all inline styles, checks contrast ratios, and fixes violations.
 */
export function enforceContrast(html: string): {
  html: string;
  corrections: ContrastCorrection[];
} {
  const corrections: ContrastCorrection[] = [];
  let result = html;

  // Also fix bgcolor + text color combinations on td/th/table elements
  const bgcolorRegex = /<(td|th|table|div)\s[^>]*bgcolor\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let bgcMatch: RegExpExecArray | null;
  const bgcolorElements: { fullMatch: string; tag: string; bgColor: string; position: number }[] = [];

  while ((bgcMatch = bgcolorRegex.exec(html)) !== null) {
    bgcolorElements.push({
      fullMatch: bgcMatch[0],
      tag: bgcMatch[1],
      bgColor: bgcMatch[2],
      position: bgcMatch.index,
    });
  }

  // Process style-based pairs
  const pairs = extractStylePairs(result);

  for (const pair of pairs) {
    const textRgb = pair.textColor ? parseColor(pair.textColor) : null;
    let bgRgb = pair.bgColor ? parseColor(pair.bgColor) : null;

    // If no explicit bg, try to find ancestor bg
    if (!bgRgb) {
      const ancestorBg = findAncestorBgColor(result, pair.startIndex);
      if (ancestorBg) bgRgb = parseColor(ancestorBg);
    }

    // Default to white background if none found
    if (!bgRgb) bgRgb = [255, 255, 255];

    if (textRgb) {
      const ratio = contrastRatio(textRgb, bgRgb);
      if (ratio < MIN_CONTRAST_RATIO) {
        const fixedColor = bestTextColor(bgRgb);
        const originalColor = pair.textColor!;

        // Replace the color in the style attribute
        const oldStyle = pair.fullMatch;
        const newStyle = oldStyle.replace(
          new RegExp(`((?:^|;)\\s*color\\s*:\\s*)${escapeRegex(originalColor)}`, 'i'),
          `$1${fixedColor}`
        );

        if (oldStyle !== newStyle) {
          result = result.split(oldStyle).join(newStyle);
          corrections.push({
            element: `<${pair.elementTag}>`,
            original: `color:${originalColor} on bg:${pair.bgColor || 'inherited'}`,
            fixed: `color:${fixedColor}`,
            ratio: Math.round(ratio * 100) / 100,
          });
        }
      }
    }
  }

  // Handle elements that have background color but text inside might not have explicit color
  // Check for td[bgcolor] containing text without explicit color
  for (const elem of bgcolorElements) {
    const bgRgb = parseColor(elem.bgColor);
    if (!bgRgb) continue;

    // Find the closing tag to get the content
    const closeTag = `</${elem.tag}>`;
    const contentStart = elem.position + elem.fullMatch.length;
    const closeIdx = result.indexOf(closeTag, contentStart);
    if (closeIdx === -1) continue;

    const content = result.substring(contentStart, closeIdx);

    // If content has text but no color: style, add one
    const hasText = content.replace(/<[^>]*>/g, '').trim().length > 0;
    const hasInlineColor = /style\s*=\s*"[^"]*color\s*:/i.test(content);
    const hasDirectTextInTd = /^[^<]*\S/.test(content.trim());

    if (hasText && !hasInlineColor && hasDirectTextInTd) {
      const appropriateColor = bestTextColor(bgRgb);
      const updatedElement = elem.fullMatch.includes('style=')
        ? elem.fullMatch.replace(/style="/, `style="color:${appropriateColor};`)
        : elem.fullMatch.replace(/>$/, ` style="color:${appropriateColor};">`);

      if (updatedElement !== elem.fullMatch) {
        result = result.split(elem.fullMatch).join(updatedElement);
        corrections.push({
          element: `<${elem.tag} bgcolor="${elem.bgColor}">`,
          original: 'no explicit text color',
          fixed: `color:${appropriateColor}`,
          ratio: 0,
        });
      }
    }
  }

  return { html: result, corrections };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

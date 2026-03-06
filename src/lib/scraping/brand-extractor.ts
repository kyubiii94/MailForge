import type { Typography, ColorPalette, VisualStyle } from '@/types';
import type { CrawledPage } from './crawler';

/**
 * Extract typography information from crawled CSS content.
 */
export function extractTypography(pages: CrawledPage[]): Typography {
  const allCss = pages.flatMap((p) => p.cssContent).join('\n');

  // Extract font families
  const fontFamilyRegex = /font-family\s*:\s*([^;}\n]+)/gi;
  const families = new Set<string>();
  let match;

  while ((match = fontFamilyRegex.exec(allCss)) !== null) {
    const family = match[1]
      .split(',')[0]
      .replace(/['"]/g, '')
      .trim();
    if (family && !isGenericFont(family)) {
      families.add(family);
    }
  }

  // Extract Google Fonts from @import or link tags
  const googleFontsRegex = /fonts\.googleapis\.com\/css2?\?family=([^&"'\s)]+)/gi;
  while ((match = googleFontsRegex.exec(allCss)) !== null) {
    const fontName = decodeURIComponent(match[1]).split(':')[0].replace(/\+/g, ' ');
    families.add(fontName);
  }

  // Extract font weights
  const weightRegex = /font-weight\s*:\s*(\d{3}|bold|normal|light)/gi;
  const weights = new Set<string>();
  while ((match = weightRegex.exec(allCss)) !== null) {
    weights.add(match[1]);
  }

  // Extract font sizes
  const sizeRegex = /font-size\s*:\s*([^;}\n]+)/gi;
  const sizes: string[] = [];
  while ((match = sizeRegex.exec(allCss)) !== null) {
    sizes.push(match[1].trim());
  }

  const familyArray = Array.from(families).slice(0, 5);
  const headingFont = familyArray[0] || 'Inter';
  const bodyFont = familyArray.length > 1 ? familyArray[1] : familyArray[0] || 'Inter';

  return {
    families: familyArray,
    weights: Array.from(weights).slice(0, 5),
    headingFont,
    bodyFont,
    sizes: {
      h1: findLargestSize(sizes) || '2.5rem',
      h2: '1.75rem',
      body: '1rem',
    },
  };
}

/**
 * Extract color palette from crawled CSS content.
 */
export function extractColorPalette(pages: CrawledPage[]): ColorPalette {
  const allCss = pages.flatMap((p) => p.cssContent).join('\n');
  const allHtml = pages.map((p) => p.html).join('\n');

  // Extract all hex colors
  const hexRegex = /#([0-9A-Fa-f]{3,8})\b/g;
  const colors = new Map<string, number>();
  let match;

  const combinedContent = allCss + allHtml;
  while ((match = hexRegex.exec(combinedContent)) !== null) {
    let hex = match[0];
    // Normalize 3-digit hex to 6-digit
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    hex = hex.toLowerCase().slice(0, 7);
    colors.set(hex, (colors.get(hex) || 0) + 1);
  }

  // Extract CSS custom properties (variables) for colors
  const varRegex = /--[\w-]*color[\w-]*\s*:\s*([^;}\n]+)/gi;
  while ((match = varRegex.exec(allCss)) !== null) {
    const value = match[1].trim();
    if (value.startsWith('#')) {
      colors.set(value.toLowerCase(), (colors.get(value.toLowerCase()) || 0) + 10);
    }
  }

  // Extract RGB/RGBA colors
  const rgbRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi;
  while ((match = rgbRegex.exec(combinedContent)) !== null) {
    const hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    colors.set(hex, (colors.get(hex) || 0) + 1);
  }

  // Filter out pure black/white and near-transparent
  const filteredColors = Array.from(colors.entries())
    .filter(([hex]) => !isBlackOrWhite(hex))
    .sort((a, b) => b[1] - a[1]);

  const topColors = filteredColors.slice(0, 5).map(([hex]) => hex);

  return {
    primary: topColors[0] || '#4263eb',
    secondary: topColors[1] || '#748ffc',
    accent: topColors[2] || '#ff6b6b',
    background: detectBackground(allCss) || '#ffffff',
    text: detectTextColor(allCss) || '#212529',
  };
}

/**
 * Analyze visual style from crawled pages.
 */
export function analyzeVisualStyleFromPages(pages: CrawledPage[]): VisualStyle {
  const totalImages = pages.reduce((sum, p) => sum + p.imageUrls.length, 0);
  const totalTextLength = pages.reduce((sum, p) => sum + p.textContent.length, 0);

  // Determine image types based on URLs
  const imageTypes = new Set<string>();
  pages.flatMap((p) => p.imageUrls).forEach((url) => {
    const lower = url.toLowerCase();
    if (lower.includes('photo') || lower.includes('unsplash') || lower.match(/\.(jpg|jpeg)/)) {
      imageTypes.add('photographies');
    }
    if (lower.includes('illustration') || lower.includes('svg') || lower.endsWith('.svg')) {
      imageTypes.add('illustrations');
    }
    if (lower.includes('icon')) {
      imageTypes.add('icônes');
    }
  });

  if (imageTypes.size === 0) {
    imageTypes.add('photographies');
  }

  // Calculate text/image ratio
  const ratio = totalImages > 0
    ? `${Math.round(totalTextLength / totalImages)} chars/image`
    : 'texte dominant';

  return {
    visualStyle: imageTypes.has('illustrations') ? 'illustratif' : 'photographique',
    imageTypes: Array.from(imageTypes),
    textImageRatio: ratio,
  };
}

// --- Helper functions ---

function isGenericFont(font: string): boolean {
  const generic = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'inherit', 'initial', 'unset'];
  return generic.includes(font.toLowerCase());
}

function findLargestSize(sizes: string[]): string | null {
  const remSizes = sizes
    .filter((s) => s.includes('rem'))
    .map((s) => parseFloat(s))
    .filter((n) => !isNaN(n))
    .sort((a, b) => b - a);

  return remSizes.length > 0 ? `${remSizes[0]}rem` : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function isBlackOrWhite(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 10 || brightness > 245;
}

function detectBackground(css: string): string | null {
  const bgMatch = css.match(/background(?:-color)?\s*:\s*(#[0-9A-Fa-f]{3,6})/i);
  return bgMatch ? bgMatch[1] : null;
}

function detectTextColor(css: string): string | null {
  const bodyColorMatch = css.match(/body[^{]*\{[^}]*color\s*:\s*(#[0-9A-Fa-f]{3,6})/i);
  return bodyColorMatch ? bodyColorMatch[1] : null;
}

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
 * Uses frequency, CSS variables (including :root / [data-theme]), and semantic names (--primary, --brand, etc.).
 */
export function extractColorPalette(pages: CrawledPage[]): ColorPalette {
  const allCss = pages.flatMap((p) => p.cssContent).join('\n');
  const allHtml = pages.map((p) => p.html).join('\n');
  const combinedContent = allCss + allHtml;

  // 1) Build map of all CSS variable names -> hex (from --name: #xxx or rgb())
  const varToHex = extractCssVariableColors(allCss);

  // 2) Semantic variables from :root / [data-theme] and anywhere: prefer these for palette roles
  const semantic = extractSemanticColors(allCss, varToHex);

  // 3) Frequency-based extraction (hex + rgb) for fallback
  const colors = new Map<string, number>();
  let match;

  const hexRegex = /#([0-9A-Fa-f]{3,8})\b/g;
  while ((match = hexRegex.exec(combinedContent)) !== null) {
    let hex = match[0];
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    hex = hex.toLowerCase().slice(0, 7);
    colors.set(hex, (colors.get(hex) || 0) + 1);
  }

  const varColorRegex = /--[\w-]*(?:color|primary|secondary|accent|brand|background|bg|text)[\w-]*\s*:\s*([^;}\n]+)/gi;
  while ((match = varColorRegex.exec(allCss)) !== null) {
    const value = match[1].trim();
    const hex = parseColorValue(value, varToHex);
    if (hex && !isBlackOrWhite(hex)) {
      colors.set(hex, (colors.get(hex) || 0) + 10);
    }
  }

  const rgbRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi;
  while ((match = rgbRegex.exec(combinedContent)) !== null) {
    const hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    colors.set(hex, (colors.get(hex) || 0) + 1);
  }

  const filteredColors = Array.from(colors.entries())
    .filter(([hex]) => !isBlackOrWhite(hex))
    .sort((a, b) => b[1] - a[1]);
  const topColors = filteredColors.slice(0, 5).map(([hex]) => hex);

  const background = semantic.background ?? detectBackground(allCss, varToHex) ?? '#ffffff';
  const text = semantic.text ?? detectTextColor(allCss, varToHex) ?? '#212529';

  return {
    primary: semantic.primary ?? topColors[0] ?? '#4263eb',
    secondary: semantic.secondary ?? topColors[1] ?? '#748ffc',
    accent: semantic.accent ?? topColors[2] ?? '#ff6b6b',
    background,
    text,
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

// --- Color extraction helpers ---

/** Extract all --var: #hex, rgb(), or var(--other) from CSS into a name -> hex map. Two passes so var() refs resolve. */
function extractCssVariableColors(css: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /--([\w-]+)\s*:\s*([^;}\n]+)/g;
  const entries: [string, string][] = [];
  let m;
  while ((m = re.exec(css)) !== null) {
    entries.push([m[1], m[2].trim()]);
  }
  // First pass: literals only
  for (const [name, value] of entries) {
    const hexLit = value.match(/^#([0-9A-Fa-f]{3,8})\b/) ? normalizeHex(value) : null;
    const rgbLit = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    const hex = hexLit ?? (rgbLit ? rgbToHex(parseInt(rgbLit[1]), parseInt(rgbLit[2]), parseInt(rgbLit[3])) : null);
    if (hex) map.set(name, hex);
  }
  // Second pass: resolve var(--x)
  for (const [name, value] of entries) {
    if (map.has(name)) continue;
    const varRef = value.match(/var\(\s*--([\w-]+)/);
    if (varRef && map.has(varRef[1])) map.set(name, map.get(varRef[1])!);
  }
  return map;
}

function normalizeHex(value: string): string {
  let hex = value.toLowerCase().slice(0, 7);
  if (hex.length === 4)
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  return hex;
}

/** Resolve a CSS color value to hex: #xxx, rgb(), or var(--name). */
function parseColorValue(value: string, varMap: Map<string, string>): string | null {
  const v = value.trim();
  const hexMatch = v.match(/^#([0-9A-Fa-f]{3,8})\b/);
  if (hexMatch) return normalizeHex(hexMatch[0]);
  const rgbMatch = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch)
    return rgbToHex(parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3]));
  const varMatch = v.match(/var\(\s*--([\w-]+)/);
  if (varMatch && varMap.has(varMatch[1])) return varMap.get(varMatch[1]) ?? null;
  return null;
}

/** Extract semantic palette from :root, [data-theme], and variable names (--primary, --brand, etc.). */
function extractSemanticColors(
  css: string,
  varToHex: Map<string, string>
): Partial<Record<'primary' | 'secondary' | 'accent' | 'background' | 'text', string>> {
  const result: Partial<Record<'primary' | 'secondary' | 'accent' | 'background' | 'text', string>> = {};
  const blocks: string[] = [];

  const rootMatch = css.match(/:root\s*\{([^}]+)\}/gi);
  if (rootMatch) blocks.push(...rootMatch.map((b) => b.replace(/^[^{]+{/, '').replace(/}$/, '')));

  const themeMatch = css.match(/\[data-theme[^\]]*\]\s*\{([^}]+)\}/gi);
  if (themeMatch) blocks.push(...themeMatch.map((b) => b.replace(/^[^{]+{/, '').replace(/}$/, '')));

  const allBlockCss = blocks.join('\n');
  const re = /--([\w-]+)\s*:\s*([^;}\n]+)/g;
  let m;
  while ((m = re.exec(allBlockCss)) !== null) {
    const name = m[1].toLowerCase();
    const hex = parseColorValue(m[2].trim(), varToHex);
    if (!hex || isBlackOrWhite(hex)) continue;
    if ((name.includes('primary') || name.includes('brand') || name === 'primary') && !result.primary) result.primary = hex;
    else if ((name.includes('secondary') || name === 'secondary') && !result.secondary) result.secondary = hex;
    else if ((name.includes('accent') || name === 'accent') && !result.accent) result.accent = hex;
    else if ((name.includes('background') || name.includes('bg') || name === 'bg') && !result.background) result.background = hex;
    else if ((name.includes('text') || name === 'color' || name.includes('foreground')) && !result.text) result.text = hex;
  }

  // Also scan full CSS for semantic variable definitions (e.g. --primary-color)
  const fullRe = /--([\w-]+)\s*:\s*([^;}\n]+)/g;
  while ((m = fullRe.exec(css)) !== null) {
    const name = m[1].toLowerCase();
    const hex = parseColorValue(m[2].trim(), varToHex);
    if (!hex || isBlackOrWhite(hex)) continue;
    if ((name.includes('primary') || name.includes('brand')) && !result.primary) result.primary = hex;
    else if (name.includes('secondary') && !result.secondary) result.secondary = hex;
    else if (name.includes('accent') && !result.accent) result.accent = hex;
    else if ((name.includes('background') || name === 'bg' || name.includes('bg-color')) && !result.background) result.background = hex;
    else if ((name.includes('text-color') || name.includes('color-text') || name === 'text' || name === 'fg') && !result.text) result.text = hex;
  }

  return result;
}

/** Detect background from :root, [data-theme], body, html and variable definitions. */
function detectBackground(css: string, varToHex: Map<string, string>): string | null {
  const blockSelectors = [/:root\s*\{([^}]+)\}/gi, /\[data-theme[^\]]*\]\s*\{([^}]+)\}/gi, /body\s*\{([^}]+)\}/gi, /html\s*\{([^}]+)\}/gi];
  for (const re of blockSelectors) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(css)) !== null) {
      const block = m[1];
      const bg = block.match(/background(?:-color)?\s*:\s*([^;}\n]+)/i);
      if (bg) {
        const hex = parseColorValue(bg[1].trim(), varToHex);
        if (hex && !isBlackOrWhite(hex)) return hex;
      }
    }
  }
  const varNames = ['background', 'bg', 'bg-color', 'background-color'];
  for (const name of varNames) {
    if (varToHex.has(name)) {
      const hex = varToHex.get(name)!;
      if (!isBlackOrWhite(hex)) return hex;
    }
  }
  const directHex = css.match(/background(?:-color)?\s*:\s*(#[0-9A-Fa-f]{3,6})\b/i);
  return directHex ? directHex[1].toLowerCase() : null;
}

/** Detect text/foreground color from :root, [data-theme], body, html and variable definitions. */
function detectTextColor(css: string, varToHex: Map<string, string>): string | null {
  const blockSelectors = [/:root\s*\{([^}]+)\}/gi, /\[data-theme[^\]]*\]\s*\{([^}]+)\}/gi, /body\s*\{([^}]+)\}/gi, /html\s*\{([^}]+)\}/gi];
  for (const re of blockSelectors) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(css)) !== null) {
      const block = m[1];
      const color = block.match(/color\s*:\s*([^;}\n]+)/i);
      if (color) {
        const hex = parseColorValue(color[1].trim(), varToHex);
        if (hex && !isBlackOrWhite(hex)) return hex;
      }
    }
  }
  const varNames = ['text', 'text-color', 'color', 'foreground', 'font-color'];
  for (const name of varNames) {
    if (varToHex.has(name)) {
      const hex = varToHex.get(name)!;
      if (!isBlackOrWhite(hex)) return hex;
    }
  }
  const bodyColorMatch = css.match(/body[^{]*\{[^}]*color\s*:\s*(#[0-9A-Fa-f]{3,6})\b/i);
  return bodyColorMatch ? bodyColorMatch[1].toLowerCase() : null;
}

// --- Typography / visual helpers ---

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

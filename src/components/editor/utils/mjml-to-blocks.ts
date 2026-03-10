/**
 * Parse MJML source string into an array of editor Blocks.
 * Uses regex-based parsing to avoid heavy DOM dependencies on the client.
 */
import type { Block, BlockType, BlockProperties } from '@/types/editor';

let nextId = 0;
function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `block-${Date.now()}-${nextId++}`;
}

/** Extract all attributes from an MJML tag string. */
function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w[\w-]*)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

/** Map common MJML attributes to BlockProperties. */
function mapCommonProps(attrs: Record<string, string>): BlockProperties {
  const props: BlockProperties = {};
  if (attrs['color']) props.textColor = attrs['color'];
  if (attrs['background-color']) props.backgroundColor = attrs['background-color'];
  if (attrs['font-size']) props.fontSize = attrs['font-size'];
  if (attrs['font-family']) props.fontFamily = attrs['font-family'];
  if (attrs['font-weight']) props.fontWeight = attrs['font-weight'];
  if (attrs['align']) props.textAlign = attrs['align'] as BlockProperties['textAlign'];
  if (attrs['text-align']) props.textAlign = attrs['text-align'] as BlockProperties['textAlign'];
  if (attrs['letter-spacing']) props.letterSpacing = attrs['letter-spacing'];
  if (attrs['text-transform']) props.textTransform = attrs['text-transform'] as BlockProperties['textTransform'];
  if (attrs['line-height']) props.lineHeight = attrs['line-height'];
  if (attrs['padding']) props.padding = attrs['padding'];
  if (attrs['border-radius']) props.borderRadius = attrs['border-radius'];
  if (attrs['border']) props.border = attrs['border'];
  if (attrs['width']) props.width = attrs['width'];
  if (attrs['height']) props.height = attrs['height'];
  if (attrs['container-background-color']) props.backgroundColor = attrs['container-background-color'];
  return props;
}

/** Detect if mj-text content is a heading. */
function detectHeading(html: string): { isHeading: boolean; level: 'h1' | 'h2' | 'h3'; content: string } {
  const m = html.match(/^[\s]*<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>[\s]*$/i);
  if (m) {
    return { isHeading: true, level: m[1].toLowerCase() as 'h1' | 'h2' | 'h3', content: m[2].trim() };
  }
  return { isHeading: false, level: 'h1', content: html.trim() };
}

/** Detect if an mj-image is full-width hero. */
function isHeroImage(attrs: Record<string, string>, sectionAttrs?: Record<string, string>): boolean {
  const w = attrs['width'] || '';
  const isFullWidth = attrs['fluid-on-mobile'] === 'true' || w === '600px' || w === '100%' || !w;
  const hasHeroBg = sectionAttrs?.['background-color'] && sectionAttrs?.['full-width'] === 'full-width';
  return isFullWidth && (!!hasHeroBg || !attrs['width']);
}

/** Parse mj-section children into blocks. */
function parseSectionChildren(sectionContent: string, sectionAttrs: Record<string, string>): Block[] {
  const blocks: Block[] = [];

  // Find mj-column(s) inside section
  const columnRegex = /<mj-column([^>]*)>([\s\S]*?)<\/mj-column>/gi;
  const columns: { attrs: Record<string, string>; content: string }[] = [];
  let colMatch: RegExpExecArray | null;

  while ((colMatch = columnRegex.exec(sectionContent)) !== null) {
    columns.push({ attrs: parseAttrs(colMatch[1]), content: colMatch[2] });
  }

  // Multi-column layout
  if (columns.length > 1) {
    const columnBlocks: Block[] = columns.map((col) => ({
      id: uid(),
      type: 'column' as BlockType,
      properties: { ...mapCommonProps(col.attrs) },
      children: parseColumnContent(col.content, sectionAttrs),
    }));
    blocks.push({
      id: uid(),
      type: 'columns',
      properties: {
        ...mapCommonProps(sectionAttrs),
        columnsCount: columns.length,
      },
      children: columnBlocks,
    });
  } else if (columns.length === 1) {
    // Single column — flatten children
    blocks.push(...parseColumnContent(columns[0].content, sectionAttrs));
  } else {
    // No columns — try parsing raw content
    blocks.push(...parseColumnContent(sectionContent, sectionAttrs));
  }

  return blocks;
}

/** Parse content within a column into blocks. */
function parseColumnContent(content: string, sectionAttrs: Record<string, string>): Block[] {
  const blocks: Block[] = [];
  // Match all mj-* tags
  const tagRegex = /<(mj-(?:text|image|button|divider|spacer|social|group|raw))([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(content)) !== null) {
    const tagName = match[1].toLowerCase();
    const attrs = parseAttrs(match[2]);
    const innerContent = match[3] || '';

    switch (tagName) {
      case 'mj-text': {
        const heading = detectHeading(innerContent);
        if (heading.isHeading) {
          blocks.push({
            id: uid(),
            type: 'heading',
            properties: {
              content: heading.content,
              headingLevel: heading.level,
              ...mapCommonProps(attrs),
            },
          });
        } else {
          blocks.push({
            id: uid(),
            type: 'text',
            properties: {
              content: innerContent.trim(),
              ...mapCommonProps(attrs),
            },
          });
        }
        break;
      }
      case 'mj-image': {
        const imgType: BlockType = isHeroImage(attrs, sectionAttrs) ? 'hero' : 'image';
        blocks.push({
          id: uid(),
          type: imgType,
          properties: {
            src: attrs['src'] || '',
            alt: attrs['alt'] || '',
            href: attrs['href'] || '',
            imageWidth: attrs['width'] || '',
            ...mapCommonProps(attrs),
          },
        });
        break;
      }
      case 'mj-button': {
        blocks.push({
          id: uid(),
          type: 'button',
          properties: {
            label: innerContent.trim(),
            href: attrs['href'] || '#',
            buttonColor: attrs['background-color'] || '',
            buttonTextColor: attrs['color'] || '',
            buttonBorderRadius: attrs['border-radius'] || '',
            buttonPadding: attrs['inner-padding'] || attrs['padding'] || '',
            ...mapCommonProps(attrs),
          },
        });
        break;
      }
      case 'mj-divider': {
        blocks.push({
          id: uid(),
          type: 'divider',
          properties: {
            ...mapCommonProps(attrs),
            border: attrs['border-width']
              ? `${attrs['border-width']} ${attrs['border-style'] || 'solid'} ${attrs['border-color'] || '#E0E0E0'}`
              : attrs['border'] || '1px solid #E0E0E0',
          },
        });
        break;
      }
      case 'mj-spacer': {
        blocks.push({
          id: uid(),
          type: 'spacer',
          properties: {
            height: attrs['height'] || '20px',
            ...mapCommonProps(attrs),
          },
        });
        break;
      }
      case 'mj-social': {
        const socialLinks: { platform: string; href: string; icon?: string }[] = [];
        const elemRegex = /<mj-social-element([^>]*)>([^<]*)<\/mj-social-element>/gi;
        let elemMatch: RegExpExecArray | null;
        while ((elemMatch = elemRegex.exec(innerContent)) !== null) {
          const elemAttrs = parseAttrs(elemMatch[1]);
          socialLinks.push({
            platform: elemAttrs['name'] || elemMatch[2].trim() || 'link',
            href: elemAttrs['href'] || '#',
            icon: elemAttrs['src'] || '',
          });
        }
        blocks.push({
          id: uid(),
          type: 'social',
          properties: {
            socialLinks,
            ...mapCommonProps(attrs),
          },
        });
        break;
      }
      case 'mj-raw': {
        blocks.push({
          id: uid(),
          type: 'code',
          properties: {
            rawHtml: innerContent.trim(),
            ...mapCommonProps(attrs),
          },
        });
        break;
      }
      default:
        break;
    }
  }

  return blocks;
}

/** Heuristic: detect if a section is likely a header (logo area). */
function isHeaderSection(content: string, _attrs: Record<string, string>, isFirst: boolean): boolean {
  if (!isFirst) return false;
  const hasLogo = /<mj-image[^>]*(?:logo|brand|header)/i.test(content);
  const hasNav = /<mj-navbar/i.test(content);
  const hasSmallImage = /<mj-image[^>]*width="[1-9]\d{1,2}px"/i.test(content);
  return hasLogo || hasNav || hasSmallImage;
}

/** Heuristic: detect if a section is likely a footer. */
function isFooterSection(content: string, isLast: boolean): boolean {
  if (!isLast) return false;
  const hasUnsubscribe = /unsubscribe|désabonnement|désinscription/i.test(content);
  const hasLegal = /©|copyright|droits|legal/i.test(content);
  return hasUnsubscribe || hasLegal;
}

/**
 * Convert MJML source into an array of Block objects.
 * If MJML is empty/invalid, tries to parse from HTML directly.
 */
export function mjmlToBlocks(mjml: string): Block[] {
  if (!mjml?.trim()) return [];

  const blocks: Block[] = [];

  // Find mj-body content
  const bodyMatch = mjml.match(/<mj-body[^>]*>([\s\S]*?)<\/mj-body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : mjml;

  // Find all mj-section tags
  const sectionRegex = /<mj-section([^>]*)>([\s\S]*?)<\/mj-section>/gi;
  const sections: { attrs: Record<string, string>; content: string }[] = [];
  let sMatch: RegExpExecArray | null;

  while ((sMatch = sectionRegex.exec(bodyContent)) !== null) {
    sections.push({ attrs: parseAttrs(sMatch[1]), content: sMatch[2] });
  }

  if (sections.length === 0) {
    // No sections found — try parsing as flat content
    return parseColumnContent(bodyContent, {});
  }

  sections.forEach((section, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === sections.length - 1;

    if (isHeaderSection(section.content, section.attrs, isFirst)) {
      const children = parseSectionChildren(section.content, section.attrs);
      blocks.push({
        id: uid(),
        type: 'header',
        properties: { ...mapCommonProps(section.attrs) },
        children,
      });
    } else if (isFooterSection(section.content, isLast)) {
      const children = parseSectionChildren(section.content, section.attrs);
      blocks.push({
        id: uid(),
        type: 'footer',
        properties: { ...mapCommonProps(section.attrs) },
        children,
        locked: true,
      });
    } else {
      blocks.push(...parseSectionChildren(section.content, section.attrs));
    }
  });

  return blocks;
}

/**
 * Fallback: parse raw HTML into blocks using simple heuristics.
 * Used when no MJML source is available.
 */
export function htmlToBlocks(html: string): Block[] {
  if (!html?.trim()) return [];

  const blocks: Block[] = [];

  // Extract content from table-based email layout
  const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let tdMatch: RegExpExecArray | null;

  while ((tdMatch = tdRegex.exec(html)) !== null) {
    const content = tdMatch[1].trim();
    if (!content || content.length < 5) continue;

    // Detect headings
    const headingMatch = content.match(/^[\s]*<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>[\s]*$/i);
    if (headingMatch) {
      blocks.push({
        id: uid(),
        type: 'heading',
        properties: {
          content: headingMatch[2].trim(),
          headingLevel: headingMatch[1].toLowerCase() as 'h1' | 'h2' | 'h3',
        },
      });
      continue;
    }

    // Detect images
    const imgMatch = content.match(/<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?/i);
    if (imgMatch && content.replace(/<img[^>]*\/?>/i, '').trim().length < 20) {
      blocks.push({
        id: uid(),
        type: 'image',
        properties: { src: imgMatch[1], alt: imgMatch[2] || '' },
      });
      continue;
    }

    // Detect buttons (links styled as buttons)
    const btnMatch = content.match(
      /<a[^>]*href="([^"]*)"[^>]*style="[^"]*(?:background|bgcolor)[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    );
    if (btnMatch) {
      blocks.push({
        id: uid(),
        type: 'button',
        properties: {
          label: btnMatch[2].replace(/<[^>]*>/g, '').trim(),
          href: btnMatch[1],
        },
      });
      continue;
    }

    // Default: text block
    if (content.replace(/<[^>]*>/g, '').trim().length > 3) {
      blocks.push({
        id: uid(),
        type: 'text',
        properties: { content },
      });
    }
  }

  return blocks.length > 0 ? blocks : [{ id: uid(), type: 'text', properties: { content: 'Contenu du template' } }];
}

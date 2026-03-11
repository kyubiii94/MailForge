'use client';

import type { Block } from '@/types/editor';

/** Retire les styles de typo du HTML pour que les propriétés du bloc (panneau droit) s'appliquent en direct. */
function stripTypographyFromHtml(html: string): string {
  if (!html?.trim()) return html;
  return html.replace(/\s+style\s*=\s*["']([^"']*)["']/gi, (match, styleContent) => {
    const cleaned = styleContent
      .replace(/\b(color|font-size|font-family|font-weight|text-align|letter-spacing|text-transform|line-height)\s*:[^;]*;?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned ? ` style="${cleaned}"` : '';
  });
}

interface Props {
  block: Block;
  onContentChange?: (content: string) => void;
}

export function TextBlock({ block, onContentChange }: Props) {
  const p = block.properties;
  const style: React.CSSProperties = {
    color: p.textColor,
    fontSize: p.fontSize,
    fontFamily: p.fontFamily,
    fontWeight: p.fontWeight as React.CSSProperties['fontWeight'],
    textAlign: p.textAlign,
    letterSpacing: p.letterSpacing,
    textTransform: p.textTransform as React.CSSProperties['textTransform'],
    lineHeight: p.lineHeight || '1.6',
    margin: 0,
  };

  const content = p.content || 'Texte...';
  const contentForDisplay = stripTypographyFromHtml(content);

  return (
    <div
      style={style}
      contentEditable={!!onContentChange}
      suppressContentEditableWarning
      onBlur={(e) => onContentChange?.(e.currentTarget.innerHTML)}
      className="outline-none focus:ring-2 focus:ring-brand-400 focus:ring-inset rounded"
      dangerouslySetInnerHTML={{ __html: contentForDisplay }}
    />
  );
}

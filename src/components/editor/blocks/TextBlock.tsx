'use client';

import type { Block } from '@/types/editor';

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
    lineHeight: p.lineHeight || '1.6',
    margin: 0,
  };

  return (
    <div
      style={style}
      contentEditable={!!onContentChange}
      suppressContentEditableWarning
      onBlur={(e) => onContentChange?.(e.currentTarget.innerHTML)}
      className="outline-none focus:ring-2 focus:ring-brand-400 focus:ring-inset rounded"
      dangerouslySetInnerHTML={{ __html: p.content || 'Texte...' }}
    />
  );
}

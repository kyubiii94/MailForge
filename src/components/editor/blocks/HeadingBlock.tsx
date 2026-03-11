'use client';

import type { Block } from '@/types/editor';

interface Props {
  block: Block;
  onContentChange?: (content: string) => void;
}

export function HeadingBlock({ block, onContentChange }: Props) {
  const p = block.properties;
  const Tag = (p.headingLevel || 'h2') as keyof JSX.IntrinsicElements;
  const style: React.CSSProperties = {
    color: p.textColor,
    fontSize: p.fontSize,
    fontFamily: p.fontFamily,
    fontWeight: (p.fontWeight || '700') as React.CSSProperties['fontWeight'],
    textAlign: p.textAlign,
    letterSpacing: p.letterSpacing,
    textTransform: p.textTransform as React.CSSProperties['textTransform'],
    lineHeight: p.lineHeight,
    margin: 0,
  };

  return (
    <Tag
      style={style}
      contentEditable={!!onContentChange}
      suppressContentEditableWarning
      onBlur={(e) => onContentChange?.(e.currentTarget.textContent || '')}
      className="outline-none focus:ring-2 focus:ring-brand-400 focus:ring-inset rounded"
    >
      {p.content || 'Titre'}
    </Tag>
  );
}

'use client';

import type { Block } from '@/types/editor';

interface Props {
  block: Block;
  onContentChange?: (content: string) => void;
}

export function QuoteBlock({ block, onContentChange }: Props) {
  const p = block.properties;

  return (
    <blockquote
      style={{
        borderLeft: p.border || '3px solid #E0E0E0',
        paddingLeft: '15px',
        margin: 0,
        backgroundColor: p.backgroundColor || '#f9f9f9',
        padding: p.padding || '20px 20px 20px 35px',
        color: p.textColor,
        fontFamily: p.fontFamily,
        fontSize: p.fontSize,
        fontStyle: 'italic',
        lineHeight: p.lineHeight || '1.6',
      }}
      contentEditable={!!onContentChange}
      suppressContentEditableWarning
      onBlur={(e) => onContentChange?.(e.currentTarget.textContent || '')}
      className="outline-none focus:ring-2 focus:ring-brand-400 focus:ring-inset rounded"
    >
      {p.content || 'Citation...'}
    </blockquote>
  );
}

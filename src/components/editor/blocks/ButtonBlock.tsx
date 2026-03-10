'use client';

import type { Block } from '@/types/editor';

interface Props {
  block: Block;
  onContentChange?: (content: string) => void;
}

export function ButtonBlock({ block, onContentChange }: Props) {
  const p = block.properties;
  const style: React.CSSProperties = {
    backgroundColor: p.buttonColor || '#0A0A0A',
    color: p.buttonTextColor || '#FFFFFF',
    borderRadius: p.buttonBorderRadius || '4px',
    padding: p.buttonPadding || '12px 24px',
    fontFamily: p.fontFamily,
    fontSize: p.fontSize || '14px',
    fontWeight: (p.fontWeight || '600') as React.CSSProperties['fontWeight'],
    textDecoration: 'none',
    display: 'inline-block',
    cursor: 'default',
    border: 'none',
    textAlign: 'center' as const,
  };

  const containerStyle: React.CSSProperties = {
    textAlign: p.textAlign || 'center',
  };

  return (
    <div style={containerStyle}>
      <span
        style={style}
        contentEditable={!!onContentChange}
        suppressContentEditableWarning
        onBlur={(e) => onContentChange?.(e.currentTarget.textContent || '')}
        className="outline-none"
      >
        {p.label || 'Bouton'}
      </span>
    </div>
  );
}

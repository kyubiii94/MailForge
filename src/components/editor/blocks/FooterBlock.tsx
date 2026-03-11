'use client';

import type { Block } from '@/types/editor';
import { renderBlock } from '../Canvas';

interface Props {
  block: Block;
  onContentChange?: (blockId: string, content: string) => void;
}

export function FooterBlock({ block, onContentChange }: Props) {
  const p = block.properties;
  const children = block.children || [];

  return (
    <div
      style={{
        backgroundColor: p.backgroundColor || '#f4f4f4',
        padding: p.padding || '20px',
        textAlign: p.textAlign || 'center',
        fontSize: '12px',
        color: p.textColor || '#888888',
      }}
    >
      {children.length > 0
        ? children.map((child) => renderBlock(child, onContentChange))
        : <span className="text-surface-400">Footer — mentions légales, désabonnement</span>
      }
    </div>
  );
}

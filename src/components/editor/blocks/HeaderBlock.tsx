'use client';

import type { Block } from '@/types/editor';
import { renderBlock } from '../Canvas';

interface Props {
  block: Block;
  onContentChange?: (blockId: string, content: string) => void;
}

export function HeaderBlock({ block, onContentChange }: Props) {
  const p = block.properties;
  const children = block.children || [];

  return (
    <div
      style={{
        backgroundColor: p.backgroundColor || '#FFFFFF',
        padding: p.padding || '10px 20px',
        textAlign: p.textAlign || 'center',
      }}
    >
      {children.length > 0
        ? children.map((child) => renderBlock(child, onContentChange))
        : <span className="text-sm text-surface-400">Header — ajoutez un logo</span>
      }
    </div>
  );
}

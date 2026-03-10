'use client';

import type { Block } from '@/types/editor';
import { renderBlock } from '../Canvas';

interface Props {
  block: Block;
  onContentChange?: (blockId: string, content: string) => void;
}

export function ColumnsBlock({ block, onContentChange }: Props) {
  const p = block.properties;
  const children = block.children || [];
  const gap = p.columnsGap || '10px';

  return (
    <div
      style={{
        display: 'flex',
        gap,
        backgroundColor: p.backgroundColor,
      }}
    >
      {children.map((col) => (
        <div
          key={col.id}
          style={{
            flex: 1,
            backgroundColor: col.properties.backgroundColor,
            padding: col.properties.padding || '0',
            minWidth: 0,
          }}
        >
          {(col.children || []).map((child) => renderBlock(child, onContentChange))}
        </div>
      ))}
    </div>
  );
}

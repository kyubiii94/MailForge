'use client';

import type { Block } from '@/types/editor';

interface Props {
  block: Block;
}

export function DividerBlock({ block }: Props) {
  const p = block.properties;
  const borderParts = (p.border || '1px solid #E0E0E0').split(' ');

  return (
    <hr
      style={{
        border: 'none',
        borderTop: p.border || '1px solid #E0E0E0',
        margin: '0',
        width: p.width || '100%',
      }}
    />
  );
}

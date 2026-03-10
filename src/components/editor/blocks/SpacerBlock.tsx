'use client';

import type { Block } from '@/types/editor';

interface Props {
  block: Block;
}

export function SpacerBlock({ block }: Props) {
  return (
    <div
      style={{ height: block.properties.height || '20px' }}
      className="bg-surface-50/50 border border-dashed border-surface-200 rounded flex items-center justify-center"
    >
      <span className="text-[10px] text-surface-400">{block.properties.height || '20px'}</span>
    </div>
  );
}

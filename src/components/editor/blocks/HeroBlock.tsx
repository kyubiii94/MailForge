'use client';

import type { Block } from '@/types/editor';
import { ImageIcon } from 'lucide-react';

interface Props {
  block: Block;
}

export function HeroBlock({ block }: Props) {
  const p = block.properties;

  if (!p.src) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-surface-100 rounded-lg border-2 border-dashed border-surface-300">
        <ImageIcon className="w-14 h-14 text-surface-400 mb-2" />
        <span className="text-sm text-surface-500">Image hero</span>
      </div>
    );
  }

  return (
    <img
      src={p.src}
      alt={p.alt || ''}
      style={{
        width: p.imageWidth || p.width || '100%',
        maxWidth: '100%',
        display: 'block',
        borderRadius: p.borderRadius,
        objectFit: p.objectFit || 'cover',
      }}
    />
  );
}

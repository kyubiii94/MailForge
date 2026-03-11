'use client';

import type { Block } from '@/types/editor';
import { ImageIcon } from 'lucide-react';

interface Props {
  block: Block;
}

export function ImageBlock({ block }: Props) {
  const p = block.properties;
  const style: React.CSSProperties = {
    width: p.imageWidth || p.width || '100%',
    maxWidth: '100%',
    borderRadius: p.borderRadius,
    objectFit: p.objectFit || 'cover',
    display: 'block',
  };

  if (!p.src) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-surface-100 rounded-lg border-2 border-dashed border-surface-300">
        <ImageIcon className="w-10 h-10 text-surface-400 mb-2" />
        <span className="text-sm text-surface-500">Cliquez pour ajouter une image</span>
      </div>
    );
  }

  return (
    <img
      src={p.src}
      alt={p.alt || ''}
      style={style}
      className="mx-auto"
    />
  );
}

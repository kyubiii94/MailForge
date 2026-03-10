'use client';

import type { Block } from '@/types/editor';
import { Package } from 'lucide-react';

interface Props {
  block: Block;
}

export function ProductCardBlock({ block }: Props) {
  const p = block.properties;

  return (
    <div
      style={{
        textAlign: p.textAlign || 'center',
        backgroundColor: p.backgroundColor || '#FFFFFF',
        borderRadius: p.borderRadius || '8px',
        border: p.border || '1px solid #E0E0E0',
        overflow: 'hidden',
      }}
    >
      {p.src ? (
        <img
          src={p.src}
          alt={p.alt || ''}
          style={{
            width: p.imageWidth || '100%',
            maxWidth: '100%',
            objectFit: p.objectFit || 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div className="flex items-center justify-center py-12 bg-surface-100">
          <Package className="w-10 h-10 text-surface-400" />
        </div>
      )}
      <div className="p-4">
        <p className="font-semibold text-surface-900" style={{ fontSize: p.fontSize }}>
          {p.content || 'Nom du produit'}
        </p>
        {p.href && (
          <span
            className="inline-block mt-2 px-4 py-2 rounded text-sm font-medium"
            style={{
              backgroundColor: p.buttonColor || '#0A0A0A',
              color: p.buttonTextColor || '#FFFFFF',
            }}
          >
            {p.label || 'Voir'}
          </span>
        )}
      </div>
    </div>
  );
}

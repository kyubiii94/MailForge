'use client';

import Link from 'next/link';
import { Layers, Pencil } from 'lucide-react';
import type { NewsletterStyle } from '@/types/library';

interface StyleCardProps {
  style: NewsletterStyle;
}

export function StyleCard({ style }: StyleCardProps) {
  return (
    <Link href={`/library/styles/${style.id}`}>
      <div className="group bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-lg hover:border-brand-300 transition-all duration-200">
        {/* Cover */}
        <div className="aspect-video bg-surface-100 relative overflow-hidden">
          {style.coverInspiration?.thumbnailPath || style.coverInspiration?.filePath ? (
            <img
              src={style.coverInspiration.thumbnailPath || style.coverInspiration.filePath}
              alt={style.name}
              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layers className="w-10 h-10 text-surface-300" />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg text-sm font-medium text-surface-800">
              <Pencil className="w-4 h-4" />
              Modifier
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-surface-900">{style.name}</h3>
          {style.description && (
            <p className="text-xs text-surface-500 mt-1 line-clamp-2">{style.description}</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-surface-400">
            <Layers className="w-3.5 h-3.5" />
            <span>{style.inspirationCount ?? 0} newsletter(s)</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

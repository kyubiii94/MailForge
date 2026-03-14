'use client';

import Link from 'next/link';
import { FileCode, Image as ImageIcon, ExternalLink } from 'lucide-react';
import type { NewsletterInspiration } from '@/types/library';
import { TagBadge } from './TagBadge';

interface InspirationCardProps {
  inspiration: NewsletterInspiration;
  selected?: boolean;
  onSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export function InspirationCard({ inspiration, selected, onSelect, selectionMode }: InspirationCardProps) {
  if (!inspiration?.id) return null;
  const isImage = inspiration.fileType === 'image';

  const cardContent = (
    <div
      className={`group relative bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-brand-300 ${
        selected ? 'ring-2 ring-brand-500 border-brand-500' : 'border-surface-200'
      }`}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(inspiration.id)}
            className="w-5 h-5 rounded border-surface-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-[4/5] bg-surface-100 overflow-hidden">
        {isImage ? (
          <img
            src={inspiration.thumbnailPath || inspiration.filePath || ''}
            alt={inspiration.title ?? ''}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-surface-400">
            <FileCode className="w-12 h-12" />
            <span className="text-sm font-medium">Fichier HTML</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* File type badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            isImage ? 'bg-blue-500/20 text-blue-100' : 'bg-orange-500/20 text-orange-100'
          }`}>
            {isImage ? <ImageIcon className="w-3 h-3" /> : <FileCode className="w-3 h-3" />}
            {isImage ? 'Image' : 'HTML'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-surface-900 truncate">{inspiration.title}</h3>
        {inspiration.sourceBrand && (
          <p className="text-xs text-surface-500 mt-1 flex items-center gap-1">
            {inspiration.sourceBrand}
            {inspiration.sourceUrl && <ExternalLink className="w-3 h-3" />}
          </p>
        )}

        {/* Tags */}
        {inspiration.tags && inspiration.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {inspiration.tags.slice(0, 3).map(tag => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
            {inspiration.tags.length > 3 && (
              <span className="text-xs text-surface-400">+{inspiration.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (selectionMode) {
    return (
      <div className="cursor-pointer" onClick={() => onSelect?.(inspiration.id)}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/library/${inspiration.id}`}>
      {cardContent}
    </Link>
  );
}

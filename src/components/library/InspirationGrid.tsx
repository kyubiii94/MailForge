'use client';

import { InspirationCard } from './InspirationCard';
import type { NewsletterInspiration } from '@/types/library';
import { ImagePlus } from 'lucide-react';
import Link from 'next/link';

interface InspirationGridProps {
  inspirations: NewsletterInspiration[];
  loading?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export function InspirationGrid({ inspirations, loading, selectedIds, onSelect, selectionMode }: InspirationGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-surface-200 rounded-xl aspect-[4/5]" />
            <div className="mt-3 h-4 bg-surface-200 rounded w-3/4" />
            <div className="mt-2 h-3 bg-surface-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (inspirations.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-100 flex items-center justify-center mb-6">
          <ImagePlus className="w-10 h-10 text-surface-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-800 mb-2">Votre bibliothèque est vide</h3>
        <p className="text-surface-500 max-w-md mx-auto mb-6">
          Uploadez des newsletters qui vous inspirent pour créer votre bibliothèque de référence visuelle.
        </p>
        <Link
          href="/library/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          Uploader une newsletter
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {inspirations.map(insp => (
        <InspirationCard
          key={insp.id}
          inspiration={insp}
          selected={selectedIds?.has(insp.id)}
          onSelect={onSelect}
          selectionMode={selectionMode}
        />
      ))}
    </div>
  );
}

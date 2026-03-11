'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Layers } from 'lucide-react';
import { StyleCard } from '@/components/library/StyleCard';
import type { NewsletterStyle } from '@/types/library';

export default function StylesPage() {
  const [styles, setStyles] = useState<NewsletterStyle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/library/styles')
      .then(r => r.json())
      .then(data => { setStyles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/library"
            className="p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Styles de newsletter</h1>
            <p className="text-sm text-surface-500 mt-0.5">{styles.length} style(s) défini(s)</p>
          </div>
        </div>
        <Link
          href="/library/styles/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau style
        </Link>
      </div>

      {/* Styles grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-surface-200 rounded-xl aspect-video" />
              <div className="mt-3 h-4 bg-surface-200 rounded w-3/4" />
              <div className="mt-2 h-3 bg-surface-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : styles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {styles.map(style => (
            <StyleCard key={style.id} style={style} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-100 flex items-center justify-center mb-6">
            <Layers className="w-10 h-10 text-surface-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-800 mb-2">Aucun style défini</h3>
          <p className="text-surface-500 max-w-md mx-auto mb-6">
            Créez des styles en regroupant des newsletters pour guider l&apos;IA lors de la génération.
          </p>
          <Link
            href="/library/styles/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer un style
          </Link>
        </div>
      )}
    </div>
  );
}

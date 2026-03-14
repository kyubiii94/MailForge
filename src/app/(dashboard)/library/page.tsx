'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ImagePlus, Layers, Tag } from 'lucide-react';
import { InspirationGrid } from '@/components/library/InspirationGrid';
import { FilterBar } from '@/components/library/FilterBar';
import { TagManager } from '@/components/library/TagManager';
import type { NewsletterInspiration, InspirationTag, NewsletterStyle, LibraryFilters } from '@/types/library';

export default function LibraryPage() {
  const [inspirations, setInspirations] = useState<NewsletterInspiration[]>([]);
  const [tags, setTags] = useState<InspirationTag[]>([]);
  const [styles, setStyles] = useState<NewsletterStyle[]>([]);
  const [filters, setFilters] = useState<LibraryFilters>({});
  const [loading, setLoading] = useState(true);
  const [showTags, setShowTags] = useState(false);

  const fetchInspirations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.fileType && filters.fileType !== 'all') params.set('fileType', filters.fileType);
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));
    if (filters.styleId) params.set('styleId', filters.styleId);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    try {
      const res = await fetch(`/api/library/inspirations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInspirations(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/library/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(Array.isArray(data) ? data : []);
      }
    } catch {
      setTags([]);
    }
  };

  const fetchStyles = async () => {
    try {
      const res = await fetch('/api/library/styles');
      if (res.ok) {
        const data = await res.json();
        setStyles(Array.isArray(data) ? data : []);
      }
    } catch {
      setStyles([]);
    }
  };

  useEffect(() => {
    fetchTags();
    fetchStyles();
  }, []);

  useEffect(() => {
    fetchInspirations();
  }, [fetchInspirations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Bibliothèque d&apos;inspiration</h1>
          <p className="text-sm text-surface-500 mt-1">
            {inspirations.length} newsletter(s) — {styles.length} style(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTags(!showTags)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-surface-700 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
          >
            <Tag className="w-4 h-4" />
            Tags
          </button>
          <Link
            href="/library/styles"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-surface-700 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
          >
            <Layers className="w-4 h-4" />
            Styles
          </Link>
          <Link
            href="/library/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            Uploader
          </Link>
        </div>
      </div>

      {/* Tag manager panel */}
      {showTags && (
        <div className="p-5 bg-white rounded-xl border border-surface-200">
          <h2 className="text-sm font-semibold text-surface-800 mb-3">Gestion des tags</h2>
          <TagManager tags={tags} onUpdate={fetchTags} />
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        tags={tags}
        styles={styles}
      />

      {/* Grid */}
      <InspirationGrid
        inspirations={inspirations}
        loading={loading}
      />
    </div>
  );
}

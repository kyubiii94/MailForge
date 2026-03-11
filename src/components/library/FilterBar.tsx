'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { InspirationTag, NewsletterStyle, LibraryFilters } from '@/types/library';
import { TagBadge } from './TagBadge';

interface FilterBarProps {
  filters: LibraryFilters;
  onFiltersChange: (filters: LibraryFilters) => void;
  tags: InspirationTag[];
  styles: NewsletterStyle[];
}

export function FilterBar({ filters, onFiltersChange, tags, styles }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleTag = (tagId: string) => {
    const current = filters.tags || [];
    const next = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];
    updateFilter('tags', next.length > 0 ? next : undefined);
  };

  const hasActiveFilters = filters.tags?.length || filters.fileType || filters.styleId;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-surface-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            hasActiveFilters
              ? 'border-brand-300 bg-brand-50 text-brand-700'
              : 'border-surface-200 text-surface-600 hover:bg-surface-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
          {hasActiveFilters && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brand-600 text-white text-xs">
              {(filters.tags?.length || 0) + (filters.fileType ? 1 : 0) + (filters.styleId ? 1 : 0)}
            </span>
          )}
        </button>

        {/* Sort */}
        <select
          value={`${filters.sortBy || 'created_at'}_${filters.sortOrder || 'desc'}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('_') as [LibraryFilters['sortBy'], 'asc' | 'desc'];
            onFiltersChange({ ...filters, sortBy, sortOrder });
          }}
          className="px-3 py-2 text-sm border border-surface-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="created_at_desc">Plus récent</option>
          <option value="created_at_asc">Plus ancien</option>
          <option value="title_asc">Titre A-Z</option>
          <option value="title_desc">Titre Z-A</option>
          <option value="source_brand_asc">Marque A-Z</option>
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onFiltersChange({ search: filters.search })}
            className="text-sm text-surface-500 hover:text-surface-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="p-4 bg-surface-50 rounded-lg border border-surface-200 space-y-4">
          {/* File type */}
          <div>
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 block">Type</label>
            <div className="flex gap-2">
              {[
                { value: undefined, label: 'Tous' },
                { value: 'image' as const, label: 'Images' },
                { value: 'html' as const, label: 'HTML' },
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => updateFilter('fileType', opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    (filters.fileType || undefined) === opt.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    size="md"
                    onClick={() => toggleTag(tag.id)}
                    selected={filters.tags?.includes(tag.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Styles */}
          {styles.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 block">Style</label>
              <select
                value={filters.styleId || ''}
                onChange={(e) => updateFilter('styleId', e.target.value || undefined)}
                className="px-3 py-2 text-sm border border-surface-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Tous les styles</option>
                {styles.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

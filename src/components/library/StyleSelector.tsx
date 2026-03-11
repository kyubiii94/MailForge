'use client';

import { useState, useEffect } from 'react';
import { Layers, ChevronDown, X, Eye } from 'lucide-react';
import type { NewsletterStyle } from '@/types/library';

interface StyleSelectorProps {
  selectedStyleId: string | null;
  onSelect: (styleId: string | null) => void;
}

export function StyleSelector({ selectedStyleId, onSelect }: StyleSelectorProps) {
  const [styles, setStyles] = useState<NewsletterStyle[]>([]);
  const [open, setOpen] = useState(false);
  const [hoveredStyle, setHoveredStyle] = useState<NewsletterStyle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/library/styles')
      .then(r => r.json())
      .then((data: NewsletterStyle[]) => {
        setStyles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selected = styles.find(s => s.id === selectedStyleId);

  if (loading) {
    return (
      <div className="h-10 bg-surface-100 rounded-lg animate-pulse" />
    );
  }

  if (styles.length === 0) return null;

  return (
    <div className="relative">
      <label className="text-sm font-medium text-surface-700 mb-1.5 block">
        Style de référence (optionnel)
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm border border-surface-200 rounded-lg bg-white hover:bg-surface-50 transition-colors text-left"
      >
        <Layers className="w-4 h-4 text-surface-400 shrink-0" />
        <span className={`flex-1 ${selected ? 'text-surface-800' : 'text-surface-400'}`}>
          {selected ? selected.name : 'Aucun style sélectionné'}
        </span>
        {selected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
            className="p-0.5 text-surface-400 hover:text-surface-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10"
            aria-label="Fermer"
          />
          <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden">
            {/* No style option */}
            <button
              type="button"
              onClick={() => { onSelect(null); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-50 transition-colors text-left ${
                !selectedStyleId ? 'bg-brand-50 text-brand-700' : 'text-surface-600'
              }`}
            >
              <X className="w-4 h-4" />
              Aucun style
            </button>

            {styles.map(style => (
              <div
                key={style.id}
                className="relative"
                onMouseEnter={() => setHoveredStyle(style)}
                onMouseLeave={() => setHoveredStyle(null)}
              >
                <button
                  type="button"
                  onClick={() => { onSelect(style.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-50 transition-colors text-left ${
                    selectedStyleId === style.id ? 'bg-brand-50 text-brand-700' : 'text-surface-800'
                  }`}
                >
                  {style.coverInspiration?.thumbnailPath ? (
                    <img
                      src={style.coverInspiration.thumbnailPath}
                      alt=""
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-surface-100 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4 text-surface-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{style.name}</p>
                    {style.description && (
                      <p className="text-xs text-surface-500 truncate">{style.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-surface-400 shrink-0">
                    {style.inspirationCount ?? 0}
                  </span>
                </button>

                {/* Popover preview */}
                {hoveredStyle?.id === style.id && style.inspirations && style.inspirations.length > 0 && (
                  <div className="absolute left-full top-0 ml-2 w-64 bg-white border border-surface-200 rounded-xl shadow-lg p-3 z-30">
                    <div className="grid grid-cols-2 gap-2">
                      {style.inspirations.slice(0, 4).map(insp => (
                        <div key={insp.id} className="aspect-[3/4] bg-surface-100 rounded-lg overflow-hidden">
                          {insp.fileType === 'image' ? (
                            <img src={insp.thumbnailPath || insp.filePath} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-surface-400">HTML</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

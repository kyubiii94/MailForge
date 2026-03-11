'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Save } from 'lucide-react';
import type { NewsletterInspiration, NewsletterStyle } from '@/types/library';
import { InspirationGrid } from './InspirationGrid';

interface StyleBuilderProps {
  style?: NewsletterStyle;
  allInspirations: NewsletterInspiration[];
  onSave: (data: {
    name: string;
    description: string;
    stylePrompt: string;
    coverInspirationId: string | null;
    inspirationIds: string[];
  }) => Promise<void>;
  saving: boolean;
}

export function StyleBuilder({ style, allInspirations, onSave, saving }: StyleBuilderProps) {
  const [name, setName] = useState(style?.name ?? '');
  const [description, setDescription] = useState(style?.description ?? '');
  const [stylePrompt, setStylePrompt] = useState(style?.stylePrompt ?? '');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(style?.inspirations?.map(i => i.id) ?? [])
  );
  const [generating, setGenerating] = useState(false);

  const toggleInspiration = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const coverInspirationId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;

  const generatePrompt = async () => {
    if (!style?.id || selectedIds.size === 0) return;

    // First save current selection
    await onSave({
      name,
      description,
      stylePrompt,
      coverInspirationId,
      inspirationIds: Array.from(selectedIds),
    });

    setGenerating(true);
    try {
      const res = await fetch('/api/library/styles/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleId: style.id }),
      });
      if (res.ok) {
        const { prompt } = await res.json();
        setStylePrompt(prompt);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      stylePrompt,
      coverInspirationId,
      inspirationIds: Array.from(selectedIds),
    });
  };

  return (
    <div className="space-y-8">
      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-surface-700 mb-1.5 block">Nom du style *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Ex: "Luxe Éditorial", "Tech Minimaliste"'
            className="w-full px-4 py-2.5 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-surface-700 mb-1.5 block">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description courte du style..."
            className="w-full px-4 py-2.5 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Select inspirations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-surface-800">
              Newsletters de référence
              <span className="ml-2 text-surface-400 font-normal">({selectedIds.size} sélectionnée(s))</span>
            </h3>
            <p className="text-xs text-surface-500 mt-0.5">La première sélectionnée devient la couverture du style</p>
          </div>
        </div>

        {allInspirations.length > 0 ? (
          <InspirationGrid
            inspirations={allInspirations}
            selectedIds={selectedIds}
            onSelect={toggleInspiration}
            selectionMode
          />
        ) : (
          <p className="text-sm text-surface-500 text-center py-8 bg-surface-50 rounded-lg">
            Aucune newsletter dans votre bibliothèque. Uploadez des newsletters d&apos;abord.
          </p>
        )}
      </div>

      {/* Style prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-surface-800">Prompt de style (directive IA)</label>
          {style?.id && selectedIds.size > 0 && (
            <button
              type="button"
              onClick={generatePrompt}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Génération...' : 'Générer avec l\'IA'}
            </button>
          )}
        </div>
        <textarea
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          rows={10}
          placeholder="Ce prompt sera injecté dans le system prompt lors de la génération de templates. Il décrit le style visuel en langage naturel. Vous pouvez le rédiger manuellement ou le générer automatiquement avec l'IA."
          className="w-full px-4 py-3 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y font-mono"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement...' : 'Enregistrer le style'}
        </button>
      </div>
    </div>
  );
}

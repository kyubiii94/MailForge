'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { AiContentSuggestion, AiStructureSuggestion } from '@/features/sfmc/ai/content-assistant';
import { ARTICLE_LAYOUTS } from '@/features/sfmc/modules/article';
import { cn } from '@/lib/utils';
import { Sparkles, Wand2, LayoutTemplate, Newspaper } from 'lucide-react';

export function AiPanel({
  emailId,
  onApply,
}: {
  emailId: string;
  onApply: (s: AiContentSuggestion, structure: AiStructureSuggestion) => void;
}) {
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiContentSuggestion | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setSelectedStructureId(null);
    try {
      const res = await fetch(`/api/emails/${emailId}/ai-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Erreur IA');
        return;
      }
      const s = data.suggestion as AiContentSuggestion;
      setSuggestion(s);
      setSelectedStructureId(s.recommendedStructureId ?? s.structures[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const selectedStructure =
    suggestion?.structures.find((s) => s.id === selectedStructureId) ?? suggestion?.structures[0];

  const layoutLabel = (id: string) => ARTICLE_LAYOUTS.find((l) => l.id === id)?.label ?? id;

  return (
    <Card className="border-brand-200 bg-brand-50/40">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-brand-600" />
        <h2 className="text-sm font-semibold text-surface-800">Assistant de contenu IA</h2>
      </div>
      <p className="text-xs text-surface-500 mb-3">
        L&apos;IA propose du <strong>contenu éditorial</strong> (dont le bloc article) et{' '}
        <strong>3 structures / templates d&apos;affichage</strong> issus du catalogue SeLoger. Elle ne
        génère jamais de code SFMC.
      </p>

      <Textarea
        label="Brief / demande"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Ex. Newsletter focus marché parisien, article sur les taux, ton expert rassurant."
      />

      <div className="flex justify-end mt-3">
        <Button onClick={generate} isLoading={loading}>
          <Wand2 className="w-4 h-4" />
          Proposer contenu + structures
        </Button>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {suggestion && (
        <div className="mt-4 space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-white border border-surface-200 space-y-1">
            <p>
              <span className="font-medium">Objet :</span> {suggestion.subject}
            </p>
            <p>
              <span className="font-medium">Pré-header :</span> {suggestion.preheader}
            </p>
            <p>
              <span className="font-medium">Titre :</span> {suggestion.heroTitle}
            </p>
            <p>
              <span className="font-medium">Intro :</span> {suggestion.heroText}
            </p>
            <p>
              <span className="font-medium">CTA :</span> {suggestion.ctaLabel}
            </p>
            {suggestion.advice.length > 0 && (
              <div>
                <span className="font-medium">Conseils :</span>
                <ul className="list-disc ml-5 text-xs text-surface-600">
                  {suggestion.advice.map((a, i) => (
                    <li key={i}>
                      {a.title} — {a.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-2 mt-2 border-t border-surface-100">
              <p className="font-medium flex items-center gap-1.5 mb-1">
                <Newspaper className="w-3.5 h-3.5 text-brand-600" />
                Article de blog
              </p>
              <p>
                <span className="text-surface-500">Titre :</span> {suggestion.article.title}
              </p>
              <p>
                <span className="text-surface-500">Teaser :</span> {suggestion.article.teaser}
              </p>
              <p>
                <span className="text-surface-500">Layout proposé :</span>{' '}
                {layoutLabel(suggestion.article.layout)}
              </p>
            </div>
          </div>

          <div>
            <p className="font-medium text-surface-800 flex items-center gap-1.5 mb-2">
              <LayoutTemplate className="w-4 h-4 text-brand-600" />
              Structures & templates d&apos;affichage
            </p>
            <p className="text-xs text-surface-500 mb-2">
              Choisissez une structure : l&apos;ordre des modules et le template article seront appliqués.
            </p>
            <div className="grid gap-2" role="radiogroup" aria-label="Structures proposées">
              {suggestion.structures.map((st) => {
                const active = selectedStructureId === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedStructureId(st.id)}
                    className={cn(
                      'text-left p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white',
                      active ? 'border-brand-500 bg-brand-50' : 'border-surface-200 hover:border-surface-300'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-surface-900">{st.label}</span>
                      {st.recommended && <Badge variant="success">Recommandée</Badge>}
                      <Badge variant="info">{layoutLabel(st.articleLayout)}</Badge>
                    </div>
                    <p className="text-xs text-surface-500 mb-1">{st.description}</p>
                    <p className="text-xs text-surface-600">
                      <span className="font-medium">Pourquoi :</span> {st.rationale}
                    </p>
                    <p className="text-[11px] text-surface-400 mt-1">
                      Modules : {st.moduleOrder.join(' → ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              disabled={!selectedStructure}
              onClick={() => selectedStructure && onApply(suggestion, selectedStructure)}
            >
              Appliquer contenu + structure
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

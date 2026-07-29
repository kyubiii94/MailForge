'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { AiContentSuggestion } from '@/features/sfmc/ai/content-assistant';
import { Sparkles, Wand2 } from 'lucide-react';

export function AiPanel({
  emailId,
  onApply,
}: {
  emailId: string;
  onApply: (s: AiContentSuggestion) => void;
}) {
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiContentSuggestion | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
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
      setSuggestion(data.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-brand-200 bg-brand-50/40">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-brand-600" />
        <h2 className="text-sm font-semibold text-surface-800">Assistant de contenu IA</h2>
      </div>
      <p className="text-xs text-surface-500 mb-3">
        L&apos;IA propose uniquement du <strong>contenu éditorial</strong> (objet, accroche, CTA, conseils). Elle ne
        génère jamais de code SFMC — celui-ci reste 100 % déterministe.
      </p>

      <Textarea
        label="Brief / demande"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Ex. Email de relance vendeurs, ton rassurant, insister sur l'estimation gratuite."
      />

      <div className="flex justify-end mt-3">
        <Button onClick={generate} isLoading={loading}>
          <Wand2 className="w-4 h-4" />
          Proposer du contenu
        </Button>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {suggestion && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="p-3 rounded-lg bg-white border border-surface-200 space-y-1">
            <p><span className="font-medium">Objet :</span> {suggestion.subject}</p>
            <p><span className="font-medium">Pré-header :</span> {suggestion.preheader}</p>
            <p><span className="font-medium">Titre :</span> {suggestion.heroTitle}</p>
            <p><span className="font-medium">Intro :</span> {suggestion.heroText}</p>
            <p><span className="font-medium">CTA :</span> {suggestion.ctaLabel}</p>
            {suggestion.advice.length > 0 && (
              <div>
                <span className="font-medium">Conseils :</span>
                <ul className="list-disc ml-5 text-xs text-surface-600">
                  {suggestion.advice.map((a, i) => (
                    <li key={i}>{a.title} — {a.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onApply(suggestion)}>
              Appliquer au formulaire
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

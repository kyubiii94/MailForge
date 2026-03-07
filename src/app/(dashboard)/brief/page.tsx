'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import type { BriefMode } from '@/types';

export default function BriefPage() {
  const router = useRouter();
  const [mode, setMode] = useState<BriefMode>('vague');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [brand, setBrand] = useState('');
  const [sector, setSector] = useState('');
  const [positioning, setPositioning] = useState('');
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState('');
  const [ambiance, setAmbiance] = useState('');
  const [palette, setPalette] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [extraContent, setExtraContent] = useState('');
  const [constraints, setConstraints] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = mode === 'precise'
        ? { mode, siteUrl }
        : {
            mode,
            brand,
            sector,
            positioning,
            objective,
            audience,
            ambiance,
            palette,
            constraints: constraints || undefined,
          };

      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la génération');
        return;
      }

      router.push(`/campaign/${data.campaign.id}`);
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-surface-900">Créer une campagne</h1>
        <p className="mt-2 text-surface-600">
          Décrivez votre marque et vos objectifs. L&apos;IA générera un ADN de campagne complet.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setMode('vague')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
            mode === 'vague'
              ? 'border-brand-600 bg-brand-50'
              : 'border-surface-200 hover:border-surface-300'
          }`}
        >
          <div className="text-2xl mb-2">💡</div>
          <div className="font-semibold text-surface-900">J&apos;ai une idée</div>
          <p className="text-sm text-surface-500 mt-1">
            Décrivez votre projet, l&apos;IA vous guide
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMode('precise')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
            mode === 'precise'
              ? 'border-brand-600 bg-brand-50'
              : 'border-surface-200 hover:border-surface-300'
          }`}
        >
          <div className="text-2xl mb-2">🌐</div>
          <div className="font-semibold text-surface-900">J&apos;ai un site web</div>
          <p className="text-sm text-surface-500 mt-1">
            Analyse automatique depuis une URL
          </p>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'precise' ? (
          <Card variant="elevated" padding="lg">
            <h2 className="text-lg font-semibold text-surface-900 mb-2">Analyse de site web</h2>
            <p className="text-sm text-surface-500 mb-6">
              Entrez l&apos;URL de votre site. L&apos;IA analysera automatiquement les couleurs, polices, ton éditorial et contenu pour construire l&apos;ADN de votre campagne.
            </p>
            <Input
              label="URL du site web *"
              type="url"
              placeholder="https://www.example.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              required
            />
            <div className="mt-4 p-3 bg-surface-50 rounded-lg">
              <p className="text-xs text-surface-500">
                <span className="font-medium text-surface-600">Ce qui sera analysé :</span> palette de couleurs, typographies, ton éditorial, mots-clés, positionnement, secteur d&apos;activité — le tout extrait directement depuis votre site.
              </p>
            </div>
          </Card>
        ) : (
          <Card variant="elevated" padding="lg">
            <h2 className="text-lg font-semibold text-surface-900 mb-6">Décrivez votre projet</h2>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nom de la marque *"
                placeholder="Ex: Maison Lumière"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
              />
              <Input
                label="Secteur d'activité"
                placeholder="Ex: Mode, Tech, Food, Beauté..."
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Positionnement"
                placeholder="Ex: Marque premium de cosmétiques naturels"
                value={positioning}
                onChange={(e) => setPositioning(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Objectif de la campagne *"
                placeholder="Ex: Lancement d'une nouvelle collection, promotion de saison..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                required
              />
            </div>

            <div className="mt-4">
              <Input
                label="Audience cible"
                placeholder="Ex: Femmes 25-45 ans, urbaines, sensibles au bio"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Ambiance / Tone of voice"
                placeholder="Ex: Luxe éditorial, fun et coloré, minimaliste..."
                value={ambiance}
                onChange={(e) => setAmbiance(e.target.value)}
              />
              <Input
                label="Palette de couleurs souhaitée"
                placeholder="Ex: Tons chauds, #1A1A1A + #D4A574..."
                value={palette}
                onChange={(e) => setPalette(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Contraintes techniques"
                placeholder="Ex: ESP utilisé (Mailchimp, SendGrid...), dark mode requis, accessibilité WCAG..."
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                hint="Optionnel"
              />
            </div>
          </Card>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" isLoading={isLoading}>
            {isLoading
              ? (mode === 'precise' ? 'Analyse du site en cours...' : 'Génération de l\'ADN...')
              : (mode === 'precise' ? 'Analyser le site' : 'Générer l\'ADN de campagne')
            }
          </Button>
        </div>
      </form>
    </div>
  );
}

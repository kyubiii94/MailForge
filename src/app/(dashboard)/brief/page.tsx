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
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          brand,
          sector,
          positioning,
          objective,
          audience,
          ambiance,
          palette,
          siteUrl: mode === 'precise' ? siteUrl : undefined,
          extraContent: extraContent || undefined,
          constraints: constraints || undefined,
        }),
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
          <div className="text-2xl mb-2">🎨</div>
          <div className="font-semibold text-surface-900">J&apos;ai un branding</div>
          <p className="text-sm text-surface-500 mt-1">
            URL du site + éléments de marque
          </p>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-semibold text-surface-900 mb-6">
            {mode === 'vague' ? 'Décrivez votre projet' : 'Vos éléments de marque'}
          </h2>

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

          {mode === 'precise' && (
            <div className="mt-6 pt-6 border-t border-surface-200 space-y-4">
              <h3 className="font-medium text-surface-800">Éléments de référence</h3>
              <Input
                label="URL du site web"
                type="url"
                placeholder="https://www.example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                hint="Le site sera analysé pour extraire couleurs, polices et ton"
              />
              <Textarea
                label="Contenu / Copy"
                placeholder="Textes, CTA, offres, produits à mettre en avant..."
                value={extraContent}
                onChange={(e) => setExtraContent(e.target.value)}
                hint="Optionnel : ajoutez du contenu à intégrer dans les newsletters"
              />
            </div>
          )}

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

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" isLoading={isLoading}>
            {isLoading ? 'Génération de l\'ADN...' : 'Générer l\'ADN de campagne'}
          </Button>
        </div>
      </form>
    </div>
  );
}

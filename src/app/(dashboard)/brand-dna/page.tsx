'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ColorSwatch } from '@/components/ui/color-swatch';
import { Badge } from '@/components/ui/badge';
import type { BrandDNA } from '@/types';
import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  Dna,
  Globe,
  Palette,
  Type,
  MessageSquare,
  Eye,
  Tag,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function BrandDNAPage() {
  const [siteUrl, setSiteUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');
  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const setBrandDNAStore = useWorkspaceStore((s) => s.setBrandDNA);

  const handleExtract = async () => {
    if (!siteUrl) return;
    setError('');
    setIsExtracting(true);
    setIsValidated(false);

    try {
      const res = await fetch('/api/brand-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Extraction failed');
      }

      const data = await res.json();
      setBrandDNA(data);
      setBrandDNAStore(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleValidate = async () => {
    if (!brandDNA) return;

    try {
      // Persist full state so manual corrections (colors, etc.) are saved
      await fetch(`/api/brand-dna/${brandDNA.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colors: brandDNA.colors,
          typography: brandDNA.typography,
          editorialTone: brandDNA.editorialTone,
          visualStyle: brandDNA.visualStyle,
          keywords: brandDNA.keywords,
          isValidated: true,
        }),
      });
      const updated = { ...brandDNA, isValidated: true };
      setIsValidated(true);
      setBrandDNAStore(updated);
    } catch {
      setError('Échec de la validation de l\'ADN');
    }
  };

  const handleColorChange = (key: keyof BrandDNA['colors'], value: string) => {
    if (!brandDNA) return;
    setBrandDNA({
      ...brandDNA,
      colors: { ...brandDNA.colors, [key]: value },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
          <Dna className="w-7 h-7 text-brand-600" />
          ADN de Marque
        </h1>
        <p className="text-surface-500 mt-1">
          Analysez automatiquement l&apos;identité de votre marque depuis votre site web.
        </p>
      </div>

      {/* URL Input */}
      <Card variant="elevated" padding="lg">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              label="URL du site web"
              placeholder="https://www.votre-site.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              hint="Nous analyserons les pages principales (accueil, à propos, produits)"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleExtract}
              isLoading={isExtracting}
              size="lg"
            >
              <Globe className="w-4 h-4" />
              {isExtracting ? 'Analyse en cours...' : 'Analyser'}
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
        )}
        {isExtracting && (
          <div className="mt-6 flex items-center gap-3 text-brand-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Crawl des pages, extraction CSS, analyse IA... Cela peut prendre jusqu&apos;à 30 secondes.</span>
          </div>
        )}
      </Card>

      {/* Results */}
      {brandDNA && (
        <div className="space-y-6 animate-fade-in">
          {/* Validation banner */}
          {isValidated && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                ADN de marque validé ! Vous pouvez maintenant créer des campagnes.
              </span>
            </div>
          )}

          {/* Color Palette — validation manuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-brand-500" />
                Palette de couleurs
              </CardTitle>
              <CardDescription>
                Couleurs extraites de votre site. Vous pouvez corriger primary, secondary et accent si l&apos;analyse automatique ne convient pas, puis valider l&apos;ADN pour enregistrer.
              </CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-6">
              {Object.entries(brandDNA.colors).map(([key, value]) => (
                <ColorSwatch
                  key={key}
                  color={value}
                  label={key}
                  size="lg"
                  editable
                  onChange={(c) => handleColorChange(key as keyof BrandDNA['colors'], c)}
                />
              ))}
            </div>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5 text-brand-500" />
                Typographie
              </CardTitle>
              <CardDescription>Polices détectées sur votre site web.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-surface-500 mb-2">Police des titres</p>
                <p className="text-2xl font-bold text-surface-900" style={{ fontFamily: brandDNA.typography.headingFont }}>
                  {brandDNA.typography.headingFont}
                </p>
              </div>
              <div>
                <p className="text-sm text-surface-500 mb-2">Police du corps</p>
                <p className="text-lg text-surface-700" style={{ fontFamily: brandDNA.typography.bodyFont }}>
                  {brandDNA.typography.bodyFont}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-surface-500 mb-2">Familles détectées</p>
                <div className="flex flex-wrap gap-2">
                  {brandDNA.typography.families.map((f) => (
                    <Badge key={f} variant="info">{f}</Badge>
                  ))}
                  {brandDNA.typography.families.length === 0 && (
                    <span className="text-sm text-surface-400">Aucune police spécifique détectée</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Editorial Tone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                Ton Éditorial
              </CardTitle>
              <CardDescription>Analyse du style de communication de votre marque.</CardDescription>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="success" className="text-base px-4 py-1">
                  {brandDNA.editorialTone.tone}
                </Badge>
              </div>
              <p className="text-sm text-surface-600">{brandDNA.editorialTone.style_notes}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-surface-500 mb-1">Formalité</p>
                  <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${brandDNA.editorialTone.formality_level * 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-surface-400 mt-1">{brandDNA.editorialTone.formality_level}/10</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-1">Énergie</p>
                  <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${brandDNA.editorialTone.energy_level * 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-surface-400 mt-1">{brandDNA.editorialTone.energy_level}/10</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Visual Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-500" />
                Style Visuel
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <p className="text-sm text-surface-600">
                <strong>Style :</strong> {brandDNA.visualStyle.visualStyle}
              </p>
              <div className="flex flex-wrap gap-2">
                {brandDNA.visualStyle.imageTypes.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
              <p className="text-xs text-surface-400">
                Ratio texte/image : {brandDNA.visualStyle.textImageRatio}
              </p>
            </div>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-500" />
                Mots-clés & Slogans
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {brandDNA.keywords.slogans.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-surface-700 mb-2">Slogans</p>
                  <div className="space-y-1">
                    {brandDNA.keywords.slogans.map((s) => (
                      <p key={s} className="text-sm text-surface-600 italic">&ldquo;{s}&rdquo;</p>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-surface-700 mb-2">Mots-clés</p>
                <div className="flex flex-wrap gap-2">
                  {brandDNA.keywords.keywords.map((k) => (
                    <Badge key={k} variant="info">{k}</Badge>
                  ))}
                </div>
              </div>
              {brandDNA.keywords.lexicalFields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-surface-700 mb-2">Champs lexicaux</p>
                  <div className="flex flex-wrap gap-2">
                    {brandDNA.keywords.lexicalFields.map((l) => (
                      <Badge key={l} variant="warning">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action buttons — validation manuelle enregistre les corrections */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Button onClick={handleValidate} size="lg" disabled={isValidated}>
              <Check className="w-4 h-4" />
              {isValidated ? 'ADN Validé' : 'Valider l\'ADN'}
            </Button>
            <Button variant="outline" onClick={handleExtract} size="lg">
              <RefreshCw className="w-4 h-4" />
              Ré-analyser
            </Button>
            {!isValidated && (
              <p className="text-sm text-surface-500">
                Vérifiez les couleurs et autres champs ci-dessus, corrigez si besoin, puis cliquez sur &quot;Valider l&apos;ADN&quot; pour enregistrer.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressSteps } from '@/components/ui/progress-steps';
import type { TextContent } from '@/types';
import {
  Type,
  Sparkles,
  FileText,
  Globe,
  ArrowRight,
  History,
  Loader2,
} from 'lucide-react';

const steps = [
  { id: 'text', label: 'Contenu Textuel' },
  { id: 'visuals', label: 'Visuels' },
  { id: 'design', label: 'Design Email' },
];

type TextOption = 'direct' | 'ai_improved' | 'url_extracted';

export default function CampaignTextPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [selectedOption, setSelectedOption] = useState<TextOption>('ai_improved');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [textContent, setTextContent] = useState<TextContent | null>(null);
  const [versions, setVersions] = useState<TextContent[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  // Option A: Direct text
  const [directText, setDirectText] = useState('');

  // Option B: AI improvement
  const [draft, setDraft] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [desiredCTA, setDesiredCTA] = useState('');
  const [targetLength, setTargetLength] = useState(300);

  // Option C: URL extraction
  const [extractUrl, setExtractUrl] = useState('');

  // Editable fields
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  useEffect(() => {
    fetchVersions();
  }, [campaignId]);

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/text/${campaignId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
        if (data.length > 0) {
          loadTextContent(data[0]);
        }
      }
    } catch {
      // Silently fail
    }
  };

  const loadTextContent = (content: TextContent) => {
    setTextContent(content);
    setSubject(content.subject);
    setPreheader(content.preheader);
    setHeadline(content.headline);
    setBody(content.body);
    setCtaText(content.ctaText);
    setCtaUrl(content.ctaUrl);
  };

  // Get brandDnaId from workspace store or fetch
  const getBrandDnaId = async (): Promise<string | null> => {
    try {
      const res = await fetch(`/api/brand-dna?workspaceId=00000000-0000-0000-0000-000000000001`);
      if (res.ok) {
        const data = await res.json();
        return data.id;
      }
    } catch {
      // Fail
    }
    return null;
  };

  const handleOptionA = async () => {
    if (!directText.trim()) return;
    setIsProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/text/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: directText, campaignId }),
      });

      if (!res.ok) throw new Error('Failed to parse text');
      const data = await res.json();
      loadTextContent(data);
      fetchVersions();
    } catch {
      setError('Erreur lors du parsing du texte.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptionB = async () => {
    if (!draft.trim() || !campaignGoal.trim()) return;
    setIsProcessing(true);
    setError('');

    try {
      const brandDnaId = await getBrandDnaId();
      if (!brandDnaId) {
        setError('brand_dna_required');
        return;
      }

      const res = await fetch('/api/text/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft,
          brandDnaId,
          campaignGoal,
          desiredCTA,
          targetLength,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error || 'Failed to improve text';
        setError(/brand dna not found|ADN de marque/i.test(msg) ? 'brand_dna_required' : msg);
        return;
      }
      const data = await res.json();

      // Set the improved content in the editor
      setSubject(data.subject);
      setPreheader(data.preheader);
      setHeadline(data.headline);
      setBody(data.body);
      setCtaText(data.ctaText);
      setTextContent(data);
    } catch {
      setError('Erreur lors de l\'amélioration. Vérifiez GEMINI_API_KEY dans .env.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptionC = async () => {
    if (!extractUrl.trim()) return;
    setIsProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/text/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: extractUrl, campaignId }),
      });

      if (!res.ok) throw new Error('Failed to extract text');
      const data = await res.json();
      loadTextContent(data);
      fetchVersions();
    } catch {
      setError('Erreur lors de l\'extraction du texte depuis l\'URL.');
    } finally {
      setIsProcessing(false);
    }
  };

  const options = [
    {
      id: 'direct' as const,
      icon: FileText,
      title: 'Texte existant',
      description: 'Collez votre texte définitif',
    },
    {
      id: 'ai_improved' as const,
      icon: Sparkles,
      title: 'Brouillon + IA',
      description: 'Claude AI améliore votre ébauche',
    },
    {
      id: 'url_extracted' as const,
      icon: Globe,
      title: 'Depuis une URL',
      description: 'Extraction automatique du contenu',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Progress */}
      <ProgressSteps
        steps={steps}
        currentStep="text"
        completedSteps={textContent ? ['text'] : []}
        onStepClick={(stepId) => {
          if (stepId !== 'text') {
            router.push(`/campaigns/${campaignId}/${stepId}`);
          }
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            <Type className="w-7 h-7 text-brand-600" />
            Contenu Textuel
          </h1>
          <p className="text-surface-500 mt-1">
            Choisissez comment alimenter le contenu de votre email.
          </p>
        </div>
        {versions.length > 0 && (
          <Button variant="ghost" onClick={() => setShowVersions(!showVersions)}>
            <History className="w-4 h-4" />
            {versions.length} version{versions.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>

      {/* Version history */}
      {showVersions && versions.length > 0 && (
        <Card padding="sm">
          <p className="text-sm font-medium text-surface-700 px-4 py-2">Historique des versions</p>
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => loadTextContent(v)}
              className="w-full text-left px-4 py-2 hover:bg-surface-50 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-surface-800">Version {v.version}</span>
              <span className="text-xs text-surface-400 ml-2">({v.sourceType})</span>
            </button>
          ))}
        </Card>
      )}

      {/* Source options */}
      <div className="grid grid-cols-3 gap-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelectedOption(opt.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedOption === opt.id
                ? 'border-brand-500 bg-brand-50'
                : 'border-surface-200 hover:border-surface-300 bg-white'
            }`}
          >
            <opt.icon className={`w-5 h-5 mb-2 ${selectedOption === opt.id ? 'text-brand-600' : 'text-surface-400'}`} />
            <p className="text-sm font-semibold text-surface-900">{opt.title}</p>
            <p className="text-xs text-surface-500 mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>

      {/* Option forms */}
      <Card variant="elevated" padding="lg">
        {selectedOption === 'direct' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Collez votre texte</CardTitle>
              <CardDescription>Le texte sera automatiquement découpé en blocs sémantiques.</CardDescription>
            </CardHeader>
            <Textarea
              value={directText}
              onChange={(e) => setDirectText(e.target.value)}
              placeholder="Collez votre contenu email ici..."
              rows={8}
              charCount
            />
            <Button onClick={handleOptionA} isLoading={isProcessing}>
              Parser le texte
            </Button>
          </div>
        )}

        {selectedOption === 'ai_improved' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Amélioration par Claude AI</CardTitle>
              <CardDescription>Soumettez une ébauche et laissez l&apos;IA créer un email aligné avec votre marque.</CardDescription>
            </CardHeader>
            <Textarea
              label="Votre brouillon / idées"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Décrivez le contenu de votre email, vos idées principales..."
              rows={6}
              charCount
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Objectif de la campagne"
                value={campaignGoal}
                onChange={(e) => setCampaignGoal(e.target.value)}
                placeholder="ex: Promotion printemps, lancement produit..."
              />
              <Input
                label="CTA souhaité"
                value={desiredCTA}
                onChange={(e) => setDesiredCTA(e.target.value)}
                placeholder="ex: Découvrir, Acheter, S'inscrire..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Longueur cible : {targetLength} mots
              </label>
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={targetLength}
                onChange={(e) => setTargetLength(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
            </div>
            <Button onClick={handleOptionB} isLoading={isProcessing} size="lg">
              <Sparkles className="w-4 h-4" />
              Générer avec Claude AI
            </Button>
          </div>
        )}

        {selectedOption === 'url_extracted' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Extraction depuis une URL</CardTitle>
              <CardDescription>Le contenu de la page sera nettoyé et proposé pour votre email.</CardDescription>
            </CardHeader>
            <Input
              label="URL de la page"
              value={extractUrl}
              onChange={(e) => setExtractUrl(e.target.value)}
              placeholder="https://www.votre-site.com/page-produit"
            />
            <Button onClick={handleOptionC} isLoading={isProcessing}>
              <Globe className="w-4 h-4" />
              Extraire le contenu
            </Button>
          </div>
        )}

        {isProcessing && (
          <div className="mt-4 flex items-center gap-3 text-brand-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">
              {selectedOption === 'ai_improved'
                ? 'Claude AI génère votre contenu...'
                : 'Traitement en cours...'}
            </span>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg px-4 py-2 bg-red-50 border border-red-100">
            {error === 'brand_dna_required' ? (
              <div className="text-sm text-red-800">
                <p className="font-medium">ADN de marque requis</p>
                <p className="mt-1 text-red-700">
                  Analysez d&apos;abord votre site dans <strong>ADN de Marque</strong> pour utiliser l&apos;amélioration IA. Les données sont réinitialisées après redémarrage du serveur.
                </p>
                <Link
                  href="/brand-dna"
                  className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-brand-600 hover:text-brand-700 underline"
                >
                  Aller à ADN de Marque →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </Card>

      {/* Structured content editor */}
      {(subject || headline || body) && (
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Contenu structuré de l&apos;email</CardTitle>
            <CardDescription>Vérifiez et ajustez le contenu avant de passer aux visuels.</CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Objet"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                hint={`${subject.length}/60 caractères`}
              />
              <Input
                label="Pré-header"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                hint={`${preheader.length}/100 caractères`}
              />
            </div>
            <Input
              label="Titre principal"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
            <Textarea
              label="Corps de l'email"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              charCount
              hint="HTML simple supporté : <p>, <strong>, <ul>, <li>"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Texte du CTA"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
              />
              <Input
                label="URL du CTA"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              onClick={() => router.push(`/campaigns/${campaignId}/visuals`)}
            >
              Étape suivante : Visuels
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

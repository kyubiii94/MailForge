'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TEMPLATE_TYPES } from '@/lib/constants';
import { sanitizeHtmlForPreview } from '@/lib/utils';
import type { Campaign, NewsletterTemplate } from '@/types';
import { ExternalLink, Eye, RefreshCw, AlertTriangle, Trash2, Link2 } from 'lucide-react';

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([1, 2, 3, 4, 8]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerating, setCurrentGenerating] = useState<string | null>(null);
  const [generationErrors, setGenerationErrors] = useState<{ templateNumber: number; error: string }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const abortRef = useRef(false);

  async function handleDeleteCampaign() {
    if (!confirm('Supprimer cette campagne et tous ses templates ? Cette action est irréversible.')) return;
    setIsDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/campaign/${campaignId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Impossible de supprimer la campagne');
        return;
      }
      router.push('/campaigns');
    } catch {
      setError('Erreur de connexion lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  }

  const fetchCampaign = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`/api/campaign/${campaignId}`);
      if (!res.ok) throw new Error('Campagne introuvable');
      const data = await res.json();
      setCampaign(data.campaign);
      setTemplates(data.templates || []);
      if (!silent && data.campaign.selectedTemplateTypes?.length > 0) {
        setSelectedTypes(data.campaign.selectedTemplateTypes);
      }
      return data.campaign as Campaign;
    } catch {
      if (!silent) setError('Impossible de charger la campagne');
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  useEffect(() => {
    if (campaign?.status === 'generating' && !isGenerating) {
      fetchCampaign(true);
    }
  }, [campaign?.status, isGenerating, fetchCampaign]);

  function toggleTemplate(num: number) {
    setSelectedTypes((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerationErrors([]);
    setError('');
    abortRef.current = false;

    const typesToGenerate = selectedTypes.includes(8) ? selectedTypes : [...selectedTypes, 8];
    const ordered = [8, ...typesToGenerate.filter((t) => t !== 8)];

    try {
      await fetch(`/api/campaign/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'generating', selectedTemplateTypes: typesToGenerate }),
      });
      setCampaign((prev) => prev ? { ...prev, status: 'generating', selectedTemplateTypes: typesToGenerate } : null);
    } catch {
      // continue anyway
    }

    let masterDesignSpecs = '';
    let masterHeadHtml = '';
    let successCount = 0;
    let firstRequest = true;

    for (const num of ordered) {
      if (abortRef.current) break;

      const typeInfo = TEMPLATE_TYPES.find((t) => t.number === num);
      setCurrentGenerating(typeInfo ? `#${num} ${typeInfo.type}` : `#${num}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const res = await fetch(`/api/campaign/${campaignId}/generate-one`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateNumber: num,
            masterDesignSpecs,
            masterHeadHtml,
            skipSiteContent: !firstRequest,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        firstRequest = false;

        const data = await res.json();

        if (!res.ok) {
          const errMsg = data.error || `Erreur template #${num}`;
          if (res.status === 503 && errMsg.toLowerCase().includes('gemini')) {
            setError('GEMINI_API_KEY non configurée sur Vercel. Ajoutez-la dans Settings → Environment Variables (Production).');
            break;
          }
          setGenerationErrors((prev) => [...prev, { templateNumber: num, error: errMsg }]);
          continue;
        }

        if (data.template) {
          setTemplates((prev) => {
            const without = prev.filter((t) => t.templateNumber !== num);
            return [...without, data.template].sort((a, b) => a.templateNumber - b.templateNumber);
          });
          successCount++;
        }

        if (num === 8 && data.masterDesignSpecs) {
          masterDesignSpecs = data.masterDesignSpecs;
          masterHeadHtml = data.masterHeadHtml || '';
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const isTimeout = /abort|timeout/i.test(errMsg) || (err instanceof Error && err.name === 'AbortError');
        setGenerationErrors((prev) => [...prev, {
          templateNumber: num,
          error: isTimeout
            ? `Template #${num} : timeout (la requête a pris trop de temps)`
            : `Template #${num} : ${errMsg}`,
        }]);
      }
    }

    try {
      const finalStatus = successCount > 0 ? 'generated' : 'dna_ready';
      await fetch(`/api/campaign/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: finalStatus }),
      });
      setCampaign((prev) => prev ? { ...prev, status: finalStatus as Campaign['status'] } : null);
    } catch {
      // status update failed, not critical
    }

    setCurrentGenerating(null);
    setIsGenerating(false);
  }

  function openHtmlInNewTab(templateNumber: number) {
    window.open(`/api/campaign/${campaignId}/template/${templateNumber}/export?format=html&inline=true`, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="rounded-xl bg-surface-50 border border-surface-200 p-6">
          <p className="font-medium text-surface-900">Campagne introuvable</p>
          <p className="text-sm text-surface-600 mt-1">
            Cette campagne n’existe pas ou n’est plus accessible. Vous pouvez retourner à la liste des campagnes ou en créer une nouvelle.
          </p>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push('/campaigns')}>
            Liste des campagnes
          </Button>
          <Button onClick={() => router.push('/brief')}>
            Créer une campagne
          </Button>
        </div>
      </div>
    );
  }

  const dna = campaign.dna;
  const totalToGenerate = selectedTypes.includes(8) ? selectedTypes.length : selectedTypes.length + 1;
  const generatedCount = templates.length;
  const progressPercent = totalToGenerate > 0 ? Math.round((generatedCount / totalToGenerate) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">{campaign.name}</h1>
          <p className="mt-1 text-surface-500">
            Campagne {campaign.status === 'generated' ? 'générée' : campaign.status === 'generating' ? 'en cours...' : 'prête'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={campaign.status === 'generated' ? 'success' : campaign.status === 'generating' ? 'warning' : 'default'}>
            {campaign.status === 'generated' ? 'Générée' : campaign.status === 'generating' ? 'En cours' : 'ADN prêt'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={handleDeleteCampaign}
            disabled={isDeleting || isGenerating}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer la campagne
          </Button>
        </div>
      </div>

      {/* DNA Summary */}
      <Card variant="elevated" padding="lg">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">ADN de campagne</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wide">Marque</h3>
            <p className="mt-1 font-medium text-surface-900">{dna.marque.name}</p>
            <p className="text-sm text-surface-600">{dna.marque.sector} &mdash; {dna.marque.positioning}</p>
            <p className="text-sm text-surface-500 mt-1 italic">{dna.marque.toneOfVoice}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wide">Objectif</h3>
            <p className="mt-1 text-surface-800">{dna.objectif}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wide">Audience</h3>
            <p className="mt-1 text-surface-800">{dna.audience}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wide">Palette</h3>
            <div className="flex gap-2 mt-1">
              {Object.entries(dna.palette).map(([name, color]) => (
                <div key={name} className="text-center">
                  <div
                    className="w-10 h-10 rounded-lg border border-surface-200 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={`${name}: ${color}`}
                  />
                  <span className="text-xs text-surface-400 mt-0.5 block">{name}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wide">Design System</h3>
            <p className="mt-1 text-sm text-surface-600">Police : {dna.designSystem.primaryFont}</p>
            <p className="text-sm text-surface-600">CTA : {dna.designSystem.ctaStyle}</p>
            <p className="text-sm text-surface-600">Border-radius : {dna.designSystem.borderRadius}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wide">Contraintes</h3>
            <p className="mt-1 text-sm text-surface-600">{dna.contraintes}</p>
          </div>
        </div>
      </Card>

      {/* Template Selection */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-surface-900">Templates à générer</h2>
            <p className="text-sm text-surface-500 mt-1">
              Sélectionnez les types de newsletters à créer. Le Master Template (#8) est toujours inclus.
            </p>
          </div>
          <div className="flex gap-2">
            {isGenerating && (
              <Button variant="outline" size="lg" onClick={() => { abortRef.current = true; }}>
                Arrêter
              </Button>
            )}
            <Button
              size="lg"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={selectedTypes.length === 0 || isGenerating}
            >
              {isGenerating ? 'Génération en cours...' : `Générer ${selectedTypes.length} template${selectedTypes.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TEMPLATE_TYPES.map((t) => {
            const isSelected = selectedTypes.includes(t.number);
            const generated = templates.find((tpl) => tpl.templateNumber === t.number);
            const genError = generationErrors.find((e) => e.templateNumber === t.number);
            const templateUrl = `/campaign/${campaignId}/template/${t.number}`;
            const cardClass = `p-4 rounded-xl border-2 text-left transition-all ${
              generated
                ? 'border-brand-500 bg-brand-50 cursor-pointer hover:bg-brand-100'
                : isSelected
                ? 'border-brand-400 bg-brand-50/50'
                : 'border-surface-200 hover:border-surface-300'
            } ${isGenerating && !generated ? 'opacity-60' : ''}`;

            const copyTemplateUrl = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof window !== 'undefined') {
                navigator.clipboard?.writeText(`${window.location.origin}${templateUrl}`);
              }
            };

            const cardContent = (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xl">{t.icon}</span>
                  <div className="flex items-center gap-2">
                    {generated && (
                      <>
                        <button
                          type="button"
                          onClick={copyTemplateUrl}
                          className="p-1.5 rounded border border-surface-200 bg-white hover:bg-surface-50 text-surface-500 hover:text-surface-700"
                          title="Copier le lien direct"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>
                        <Badge variant="success">Généré</Badge>
                      </>
                    )}
                    {genError && (
                      <Badge variant="danger">Erreur</Badge>
                    )}
                    {isGenerating && !generated && !genError && isSelected && (
                      <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full" />
                    )}
                    {!generated && !isGenerating && !genError && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'border-brand-600 bg-brand-600' : 'border-surface-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-surface-400 font-mono">#{t.number}</span>
                  <p className="font-medium text-surface-900">{t.type}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{t.objective}</p>
                </div>
                {generated && (
                  <p className="text-xs text-brand-600 mt-2 font-medium">
                    Cliquer pour voir le template · Lien direct disponible
                  </p>
                )}
              </>
            );

            if (generated) {
              return (
                <Link key={t.number} href={templateUrl} className={cardClass}>
                  {cardContent}
                </Link>
              );
            }

            return (
              <button
                key={t.number}
                type="button"
                onClick={() => !isGenerating && toggleTemplate(t.number)}
                disabled={isGenerating}
                className={cardClass}
              >
                {cardContent}
              </button>
            );
          })}
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm space-y-1">
          <p className="font-medium">Erreur</p>
          <p>{error}</p>
          {(error.includes('GEMINI') || error.includes('timeout') || error.includes('Vercel')) && (
            <p className="mt-2 text-red-600 text-xs">
              Conseil : vérifiez GEMINI_API_KEY dans Vercel (Environment Variables) et que le déploiement a bien été refait après ajout des variables.
            </p>
          )}
        </div>
      )}

      {/* Generation Progress */}
      {isGenerating && (
        <Card variant="bordered" padding="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-brand-600 animate-spin" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-surface-900">Génération en cours...</p>
                  <span className="text-sm font-medium text-brand-600">{generatedCount} / {totalToGenerate}</span>
                </div>
                <p className="text-sm text-surface-500 mt-0.5">
                  {currentGenerating
                    ? `Génération de ${currentGenerating}...`
                    : 'Préparation...'}
                </p>
              </div>
            </div>
            <div className="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progressPercent, 5)}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Generation Errors */}
      {generationErrors.length > 0 && !isGenerating && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="font-medium">Certains templates n&apos;ont pas pu être générés :</p>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {generationErrors.map((e) => (
              <li key={e.templateNumber}>{e.error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Generated Templates Display */}
      {templates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900">
              Templates générés ({templates.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <Card key={tpl.id} variant="bordered" padding="none" className="overflow-hidden">
                {/* Preview iframe */}
                <div className="relative bg-surface-50 border-b border-surface-200" style={{ height: 200 }}>
                  <iframe
                    srcDoc={sanitizeHtmlForPreview(tpl.htmlCode)}
                    title={`Preview ${tpl.templateType}`}
                    className="w-full h-full border-0 pointer-events-none"
                    style={{ transform: 'scale(0.4)', transformOrigin: 'top left', width: '250%', height: '500px' }}
                    sandbox="allow-same-origin"
                    tabIndex={-1}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={tpl.templateNumber === 8 ? 'warning' : 'success'}>
                      #{tpl.templateNumber}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-surface-900">{tpl.templateType}</p>
                    <p className="text-sm text-surface-500 mt-0.5 truncate" title={tpl.subjectLine}>
                      {tpl.subjectLine || 'Pas d\'objet'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/campaign/${campaignId}/template/${tpl.templateNumber}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 hover:border-surface-300 transition-colors flex-1 min-w-0"
                    >
                      <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                      Voir le détail
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Copier le lien direct vers ce template"
                      onClick={() => {
                        const url = typeof window !== 'undefined' ? `${window.location.origin}/campaign/${campaignId}/template/${tpl.templateNumber}` : '';
                        navigator.clipboard?.writeText(url).then(() => { /* copied */ });
                      }}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Lien
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => openHtmlInNewTab(tpl.templateNumber)}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ouvrir HTML
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

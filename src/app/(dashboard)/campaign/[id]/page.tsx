'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TEMPLATE_TYPES } from '@/lib/constants';
import { sanitizeHtmlForPreview } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ColorSwatch } from '@/components/ui/color-swatch';
import type { Campaign, CampaignDNA, NewsletterTemplate } from '@/types';
import { ExternalLink, Eye, RefreshCw, AlertTriangle, Trash2, Link2, Pencil, Save, X } from 'lucide-react';

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
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [isEditingDna, setIsEditingDna] = useState(false);
  const [editedDna, setEditedDna] = useState<CampaignDNA | null>(null);
  const [isSavingDna, setIsSavingDna] = useState(false);

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

  function startEditingDna() {
    if (!campaign) return;
    setEditedDna(JSON.parse(JSON.stringify(campaign.dna)));
    setIsEditingDna(true);
  }

  function cancelEditingDna() {
    setIsEditingDna(false);
    setEditedDna(null);
  }

  async function saveDna() {
    if (!editedDna || !campaign) return;
    setIsSavingDna(true);
    setError('');
    try {
      const res = await fetch(`/api/campaign/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dna: editedDna }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Impossible de sauvegarder l\'ADN');
        return;
      }
      const data = await res.json();
      setCampaign(data.campaign);
      setIsEditingDna(false);
      setEditedDna(null);
    } catch {
      setError('Erreur de connexion lors de la sauvegarde de l\'ADN');
    } finally {
      setIsSavingDna(false);
    }
  }

  function updateDnaField<K extends keyof CampaignDNA>(field: K, value: CampaignDNA[K]) {
    setEditedDna((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  function updateDnaMarque(field: keyof CampaignDNA['marque'], value: string) {
    setEditedDna((prev) => prev ? { ...prev, marque: { ...prev.marque, [field]: value } } : prev);
  }

  function updateDnaDesignSystem(field: keyof CampaignDNA['designSystem'], value: string) {
    setEditedDna((prev) => prev ? { ...prev, designSystem: { ...prev.designSystem, [field]: value } } : prev);
  }

  function updateDnaPalette(field: keyof CampaignDNA['palette'], value: string) {
    setEditedDna((prev) => prev ? { ...prev, palette: { ...prev.palette, [field]: value } } : prev);
  }

  async function handleDeleteTemplate(tpl: NewsletterTemplate) {
    if (!confirm(`Supprimer le template #${tpl.templateNumber} (${tpl.templateType}) ? Vous pourrez le régénérer ensuite.`)) return;
    setDeletingTemplateId(tpl.id);
    setError('');
    try {
      const res = await fetch(`/api/campaign/${campaignId}/template/${tpl.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Impossible de supprimer le template');
        return;
      }
      await fetchCampaign(true);
    } catch {
      setError('Erreur de connexion lors de la suppression du template');
    } finally {
      setDeletingTemplateId(null);
    }
  }

  const fetchCampaign = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`/api/campaign/${campaignId}`);
      if (!res.ok) throw new Error('Campagne introuvable');
      const data = await res.json();
      setCampaign(data.campaign);
      setTemplates(data.templates || []);

      // Si le statut est resté bloqué sur "generating" (par ex. page rechargée
      // pendant une génération), on le normalise en fonction des templates.
      if (!isGenerating && data.campaign?.status === 'generating') {
        const hasTemplates = Array.isArray(data.templates) && data.templates.length > 0;
        const finalStatus: Campaign['status'] = hasTemplates ? 'generated' : 'dna_ready';
        setCampaign((prev) => prev ? { ...prev, status: finalStatus } : prev);
        // Tentative de mise à jour côté API (best-effort, erreurs ignorées)
        fetch(`/api/campaign/${campaignId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: finalStatus }),
        }).catch(() => {});
      }
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
    let masterHtmlCode = '';
    let masterFooterHtml = '';
    let masterCtaHtml = '';
    let successCount = 0;

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
            masterHtmlCode,
            masterFooterHtml,
            masterCtaHtml,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

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

        if (num === 8) {
          if (data.masterDesignSpecs) masterDesignSpecs = data.masterDesignSpecs;
          if (data.masterHeadHtml) masterHeadHtml = data.masterHeadHtml;
          if (data.masterHtmlCode) masterHtmlCode = data.masterHtmlCode;
          if (data.masterFooterHtml) masterFooterHtml = data.masterFooterHtml;
          if (data.masterCtaHtml) masterCtaHtml = data.masterCtaHtml;
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

  function openHtmlInNewTab(templateId: string) {
    const id = campaign?.id ?? campaignId;
    window.open(`/api/campaign/${id}/template/${templateId}/export?format=html&inline=true`, '_blank');
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
  const canonicalId = campaign.id;

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
            title="Supprimer la campagne"
            aria-label="Supprimer la campagne"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* DNA Summary */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900">ADN de campagne</h2>
          {!isEditingDna ? (
            <Button variant="outline" size="sm" onClick={startEditingDna} disabled={isGenerating}>
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={cancelEditingDna} disabled={isSavingDna}>
                <X className="w-3.5 h-3.5" />
                Annuler
              </Button>
              <Button size="sm" onClick={saveDna} disabled={isSavingDna} className="bg-green-600 hover:bg-green-700 text-white">
                {isSavingDna ? (
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        {!isEditingDna ? (
          /* ── Mode lecture ── */
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
        ) : editedDna && (
          /* ── Mode edition ── */
          <div className="space-y-6">
            {/* Marque */}
            <div>
              <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wide mb-2">Marque</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Nom" value={editedDna.marque.name} onChange={(e) => updateDnaMarque('name', e.target.value)} />
                <Input label="Secteur" value={editedDna.marque.sector} onChange={(e) => updateDnaMarque('sector', e.target.value)} />
                <div className="col-span-2">
                  <Input label="Positionnement" value={editedDna.marque.positioning} onChange={(e) => updateDnaMarque('positioning', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Ton de voix</label>
                  <textarea
                    value={editedDna.marque.toneOfVoice}
                    onChange={(e) => updateDnaMarque('toneOfVoice', e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 text-sm bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-surface-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Objectif + Audience */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-surface-500 uppercase tracking-wide mb-2">Objectif</label>
                <textarea
                  value={editedDna.objectif}
                  onChange={(e) => updateDnaField('objectif', e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 text-sm bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-surface-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-500 uppercase tracking-wide mb-2">Audience</label>
                <textarea
                  value={editedDna.audience}
                  onChange={(e) => updateDnaField('audience', e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 text-sm bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-surface-400 transition-colors"
                />
              </div>
            </div>

            {/* Palette */}
            <div>
              <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wide mb-2">Palette</h3>
              <div className="flex flex-wrap gap-4">
                {(Object.keys(editedDna.palette) as Array<keyof typeof editedDna.palette>).map((colorKey) => (
                  <div key={colorKey} className="flex flex-col items-center gap-1.5">
                    <ColorSwatch
                      color={editedDna.palette[colorKey]}
                      label={colorKey}
                      size="lg"
                      editable
                      onChange={(c) => updateDnaPalette(colorKey, c)}
                    />
                    <input
                      type="text"
                      value={editedDna.palette[colorKey]}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v.match(/^#?[0-9a-fA-F]{0,6}$/)) {
                          updateDnaPalette(colorKey, v.startsWith('#') ? v : `#${v}`);
                        }
                      }}
                      className="w-20 px-2 py-1 text-xs font-mono text-center border border-surface-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      maxLength={7}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Design System */}
            <div>
              <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wide mb-2">Design System</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Police principale" value={editedDna.designSystem.primaryFont} onChange={(e) => updateDnaDesignSystem('primaryFont', e.target.value)} />
                <Input label="Police secondaire" value={editedDna.designSystem.secondaryFont} onChange={(e) => updateDnaDesignSystem('secondaryFont', e.target.value)} />
                <Input label="Border-radius" value={editedDna.designSystem.borderRadius} onChange={(e) => updateDnaDesignSystem('borderRadius', e.target.value)} />
                <Input label="Espacement" value={editedDna.designSystem.spacingSystem} onChange={(e) => updateDnaDesignSystem('spacingSystem', e.target.value)} />
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Style CTA</label>
                  <textarea
                    value={editedDna.designSystem.ctaStyle}
                    onChange={(e) => updateDnaDesignSystem('ctaStyle', e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 text-sm bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-surface-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Contraintes */}
            <div>
              <label className="block text-sm font-medium text-surface-500 uppercase tracking-wide mb-2">Contraintes</label>
              <textarea
                value={editedDna.contraintes}
                onChange={(e) => updateDnaField('contraintes', e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 text-sm bg-white text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:border-surface-400 transition-colors"
              />
            </div>
          </div>
        )}
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
            const templateUrl = generated ? `/campaign/${canonicalId}/template/${generated.id}` : '';
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
                  {(!tpl.htmlCode || tpl.htmlCode.trim().length < 400) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-surface-100">
                      <p className="text-sm text-surface-500">Aperçu non disponible</p>
                      <p className="text-xs text-surface-400 mt-1">Voir le détail pour régénérer le contenu</p>
                    </div>
                  ) : (
                    <iframe
                      srcDoc={sanitizeHtmlForPreview(tpl.htmlCode)}
                      title={`Preview ${tpl.templateType}`}
                      className="w-full h-full border-0 pointer-events-none"
                      style={{ transform: 'scale(0.4)', transformOrigin: 'top left', width: '250%', height: '500px' }}
                      sandbox="allow-same-origin"
                      tabIndex={-1}
                    />
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {(!tpl.htmlCode || tpl.htmlCode.trim().length < 400) && (
                      <Badge variant="danger" className="text-xs">Contenu vide</Badge>
                    )}
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
                      href={`/campaign/${canonicalId}/template/${tpl.id}`}
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
                        const url = typeof window !== 'undefined' ? `${window.location.origin}/campaign/${canonicalId}/template/${tpl.id}` : '';
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
                      onClick={() => openHtmlInNewTab(tpl.id)}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ouvrir HTML
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Supprimer ce template pour pouvoir le régénérer"
                      onClick={() => handleDeleteTemplate(tpl)}
                      disabled={deletingTemplateId === tpl.id}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      {deletingTemplateId === tpl.id ? (
                        <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Supprimer
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

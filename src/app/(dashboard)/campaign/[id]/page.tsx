'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TEMPLATE_TYPES } from '@/lib/constants';
import type { Campaign, NewsletterTemplate } from '@/types';
import { ExternalLink, Eye, RefreshCw } from 'lucide-react';

const POLL_INTERVAL = 8000;
const POLL_TIMEOUT = 5 * 60 * 1000;

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([1, 2, 3, 4, 8]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<{ templateNumber: number; status: string; error?: string }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);
  const generateRequestRef = useRef<boolean>(false);
  const hasSeenGeneratingRef = useRef<boolean>(false);

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

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollStartRef.current = Date.now();
    hasSeenGeneratingRef.current = false;

    const doPoll = async () => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT) {
        stopPolling();
        setIsGenerating(false);
        setError('La génération a pris trop de temps. Rechargez la page pour voir les templates déjà générés.');
        return;
      }
      const c = await fetchCampaign(true);
      if (c?.status === 'generating') hasSeenGeneratingRef.current = true;
      const elapsed = Date.now() - pollStartRef.current;
      const canStopOnFinal = hasSeenGeneratingRef.current || elapsed > 15000;
      // #region agent log
      fetch('http://127.0.0.1:7431/ingest/968ac623-3680-436d-a229-5b21b3a15e3e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '76820e' }, body: JSON.stringify({ sessionId: '76820e', location: 'campaign/[id]/page.tsx:pollTick', message: 'poll tick', data: { campaignStatus: c?.status, canStopOnFinal, hasSeenGenerating: hasSeenGeneratingRef.current, elapsed }, timestamp: Date.now(), hypothesisId: 'H1,H3' }) }).catch(() => {});
      // #endregion
      if (c && (c.status === 'generated' || c.status === 'dna_ready') && canStopOnFinal) {
        stopPolling();
        setIsGenerating(false);
      }
    };

    // Premier poll rapide pour afficher la progression tôt
    setTimeout(doPoll, 2500);
    pollRef.current = setInterval(doPoll, POLL_INTERVAL);
  }, [fetchCampaign, stopPolling]);

  useEffect(() => {
    fetchCampaign();
    return () => stopPolling();
  }, [fetchCampaign, stopPolling]);

  useEffect(() => {
    if (campaign?.status === 'generating' && !isGenerating && !pollRef.current) {
      setIsGenerating(true);
      startPolling();
    }
  }, [campaign?.status, isGenerating, startPolling]);

  function toggleTemplate(num: number) {
    setSelectedTypes((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  }

  async function handleGenerate() {
    // #region agent log
    fetch('http://127.0.0.1:7431/ingest/968ac623-3680-436d-a229-5b21b3a15e3e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '76820e' }, body: JSON.stringify({ sessionId: '76820e', location: 'campaign/[id]/page.tsx:handleGenerate:entry', message: 'handleGenerate called', data: { campaignId, selectedCount: selectedTypes.length }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {});
    // #endregion
    setIsGenerating(true);
    setGenerationResults([]);
    setError('');
    generateRequestRef.current = true;
    startPolling();

    try {
      const typesToGenerate = selectedTypes.includes(8) ? selectedTypes : [...selectedTypes, 8];

      const res = await fetch(`/api/campaign/${campaignId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTypes: typesToGenerate }),
      });

      // #region agent log
      fetch('http://127.0.0.1:7431/ingest/968ac623-3680-436d-a229-5b21b3a15e3e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '76820e' }, body: JSON.stringify({ sessionId: '76820e', location: 'campaign/[id]/page.tsx:afterFetch', message: 'fetch returned', data: { status: res.status, ok: res.ok }, timestamp: Date.now(), hypothesisId: 'H1,H4,H5' }) }).catch(() => {});
      // #endregion

      let data: { results?: { templateNumber: number; status: string; error?: string }[]; templates?: NewsletterTemplate[]; error?: string };
      try {
        data = await res.json();
      } catch {
        // #region agent log
        fetch('http://127.0.0.1:7431/ingest/968ac623-3680-436d-a229-5b21b3a15e3e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '76820e' }, body: JSON.stringify({ sessionId: '76820e', location: 'campaign/[id]/page.tsx:jsonThrow', message: 'res.json() threw', data: { status: res.status }, timestamp: Date.now(), hypothesisId: 'H5' }) }).catch(() => {});
        // #endregion
        // Réponse non-JSON (ex: 502/504 HTML) — le body est déjà consommé
        if (res.status >= 500) {
          setError('Le serveur a mis trop de temps à répondre. Les templates déjà générés apparaîtront ci-dessous dans quelques secondes.');
        } else {
          setError('Réponse serveur invalide. Rechargez la page ou attendez la mise à jour automatique.');
        }
        stopPolling();
        setIsGenerating(false);
        generateRequestRef.current = false;
        setTimeout(() => fetchCampaign(false), 2000);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la génération');
        stopPolling();
        setIsGenerating(false);
        generateRequestRef.current = false;
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7431/ingest/968ac623-3680-436d-a229-5b21b3a15e3e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '76820e' }, body: JSON.stringify({ sessionId: '76820e', location: 'campaign/[id]/page.tsx:successPath', message: 'success path setting state', data: { resultsLen: (data.results || []).length, templatesLen: (data.templates || []).length }, timestamp: Date.now(), hypothesisId: 'H2,H5' }) }).catch(() => {});
      // #endregion
      setGenerationResults(data.results || []);
      setTemplates(data.templates || []);
      setCampaign((prev) => (prev ? { ...prev, status: 'generated' as const, selectedTemplateTypes: typesToGenerate } : null));
      stopPolling();
      setIsGenerating(false);
      generateRequestRef.current = false;
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7431/ingest/968ac623-3680-436d-a229-5b21b3a15e3e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '76820e' }, body: JSON.stringify({ sessionId: '76820e', location: 'campaign/[id]/page.tsx:catch', message: 'handleGenerate catch', data: { errMsg: err instanceof Error ? err.message : String(err) }, timestamp: Date.now(), hypothesisId: 'H3,H4' }) }).catch(() => {});
      // #endregion
      generateRequestRef.current = false;
      setError('Erreur de connexion. Un rafraîchissement automatique va récupérer les templates déjà générés.');
      // Un premier poll rapide pour mettre à jour l'UI
      const c = await fetchCampaign(true);
      // #region agent log
      fetch('http://127.0.0.1:7431/ingest/968ac623-3680-436d-a229-5b21b3a15e3e', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '76820e' }, body: JSON.stringify({ sessionId: '76820e', location: 'campaign/[id]/page.tsx:afterCatchFetch', message: 'after fetchCampaign in catch', data: { campaignStatus: c?.status }, timestamp: Date.now(), hypothesisId: 'H3' }) }).catch(() => {});
      // #endregion
      if (c && (c.status === 'generated' || c.status === 'dna_ready')) {
        stopPolling();
        setIsGenerating(false);
      } else {
        setTimeout(async () => {
          const c2 = await fetchCampaign(true);
          if (c2 && (c2.status === 'generated' || c2.status === 'dna_ready')) {
            stopPolling();
            setIsGenerating(false);
          }
        }, 4000);
      }
    }
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
      <div className="text-center py-16">
        <p className="text-surface-500">Campagne introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/brief')}>
          Créer une campagne
        </Button>
      </div>
    );
  }

  const dna = campaign.dna;
  const totalToGenerate = selectedTypes.includes(8) ? selectedTypes.length : selectedTypes.length + 1;
  const generatedCount = templates.length;
  const progressPercent = totalToGenerate > 0 ? Math.round((generatedCount / totalToGenerate) * 100) : 0;
  const lastGenerated = templates.length > 0 ? templates[templates.length - 1] : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">{campaign.name}</h1>
          <p className="mt-1 text-surface-500">
            Campagne {campaign.status === 'generated' ? 'générée' : campaign.status === 'generating' ? 'en cours...' : 'prête'}
          </p>
        </div>
        <Badge variant={campaign.status === 'generated' ? 'success' : campaign.status === 'generating' ? 'warning' : 'default'}>
          {campaign.status === 'generated' ? 'Générée' : campaign.status === 'generating' ? 'En cours' : 'ADN prêt'}
        </Badge>
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
          <Button
            size="lg"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={selectedTypes.length === 0 || isGenerating}
          >
            {isGenerating ? 'Génération en cours...' : `Générer ${selectedTypes.length} template${selectedTypes.length > 1 ? 's' : ''}`}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TEMPLATE_TYPES.map((t) => {
            const isSelected = selectedTypes.includes(t.number);
            const generated = templates.find((tpl) => tpl.templateNumber === t.number);
            const result = generationResults.find((r) => r.templateNumber === t.number);

            return (
              <button
                key={t.number}
                type="button"
                onClick={() => {
                  if (generated) {
                    router.push(`/campaign/${campaignId}/template/${t.number}`);
                  } else if (!isGenerating) {
                    toggleTemplate(t.number);
                  }
                }}
                disabled={isGenerating && !generated}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  generated
                    ? 'border-brand-500 bg-brand-50 cursor-pointer hover:bg-brand-100'
                    : isSelected
                    ? 'border-brand-400 bg-brand-50/50'
                    : 'border-surface-200 hover:border-surface-300'
                } ${isGenerating && !generated ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{t.icon}</span>
                  <div className="flex items-center gap-2">
                    {generated && (
                      <Badge variant="success">Généré</Badge>
                    )}
                    {result?.status === 'error' && (
                      <Badge variant="danger">Erreur</Badge>
                    )}
                    {isGenerating && !generated && isSelected && (
                      <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full" />
                    )}
                    {!generated && !isGenerating && (
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
                    Cliquer pour voir le template &rarr;
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
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
                  {lastGenerated
                    ? `Dernier généré : #${lastGenerated.templateNumber} — ${lastGenerated.templateType}`
                    : 'Chaque template est généré individuellement par l\'IA.'}
                </p>
              </div>
            </div>
            <div className="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progressPercent, isGenerating ? 5 : 0)}%` }}
              />
            </div>
          </div>
        </Card>
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
                    srcDoc={tpl.htmlCode}
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

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/campaign/${campaignId}/template/${tpl.templateNumber}`)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Voir le détail
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NewsletterTemplate, Campaign } from '@/types';

type Tab = 'preview' | 'html' | 'mjml' | 'specs';

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const templateNum = params.num as string;

  const [template, setTemplate] = useState<NewsletterTemplate | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTemplate = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaign/${campaignId}/template/${templateNum}`);
      if (!res.ok) throw new Error('Template introuvable');
      const data = await res.json();
      setTemplate(data.template);
      setCampaign(data.campaign);
    } catch {
      setError('Impossible de charger le template');
    } finally {
      setLoading(false);
    }
  }, [campaignId, templateNum]);

  useEffect(() => { fetchTemplate(); }, [fetchTemplate]);

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/campaign/${campaignId}/template/${templateNum}/regenerate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur de régénération');
        return;
      }
      setTemplate(data.template);
    } catch {
      setError('Erreur de connexion');
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleExport(format: 'html' | 'mjml') {
    window.open(`/api/campaign/${campaignId}/template/${templateNum}/export?format=${format}`, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-500">Template introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push(`/campaign/${campaignId}`)}>
          Retour à la campagne
        </Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'preview', label: 'Aperçu' },
    { id: 'html', label: 'Code HTML' },
    { id: 'mjml', label: 'Code MJML' },
    { id: 'specs', label: 'Specs Design' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push(`/campaign/${campaignId}`)}
            className="text-sm text-surface-500 hover:text-surface-700 mb-2 inline-flex items-center gap-1"
          >
            ← Retour à la campagne
          </button>
          <h1 className="text-2xl font-bold text-surface-900">
            #{template.templateNumber} — {template.templateType}
          </h1>
          {campaign && <p className="text-surface-500 mt-1">{campaign.name}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRegenerate} isLoading={isRegenerating}>
            Régénérer
          </Button>
          <Button variant="secondary" onClick={() => handleExport('html')}>
            Export HTML
          </Button>
          <Button variant="secondary" onClick={() => handleExport('mjml')}>
            Export MJML
          </Button>
        </div>
      </div>

      {/* Subject & Preview */}
      <Card variant="bordered" padding="md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Objet</span>
            <p className="mt-1 font-medium text-surface-900">{template.subjectLine}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Preview text</span>
            <p className="mt-1 text-surface-600">{template.previewText}</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'preview' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                previewMode === 'desktop' ? 'bg-brand-100 text-brand-700' : 'text-surface-500 hover:bg-surface-100'
              }`}
            >
              Desktop (600px)
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                previewMode === 'mobile' ? 'bg-brand-100 text-brand-700' : 'text-surface-500 hover:bg-surface-100'
              }`}
            >
              Mobile (375px)
            </button>
          </div>
          <div className="bg-surface-100 rounded-xl p-8 flex justify-center">
            <div
              className="bg-white shadow-lg rounded-lg overflow-hidden"
              style={{ width: previewMode === 'desktop' ? 600 : 375 }}
            >
              <iframe
                srcDoc={template.htmlCode}
                title={`Preview ${template.templateType}`}
                className="w-full border-0"
                style={{ height: 800, width: '100%' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'html' && (
        <Card variant="bordered" padding="none">
          <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200">
            <span className="text-sm font-medium text-surface-600">HTML Email</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(template.htmlCode)}
            >
              Copier
            </Button>
          </div>
          <pre className="p-4 text-xs text-surface-700 overflow-auto max-h-[600px] bg-surface-50">
            <code>{template.htmlCode}</code>
          </pre>
        </Card>
      )}

      {activeTab === 'mjml' && (
        <Card variant="bordered" padding="none">
          <div className="flex items-center justify-between px-4 py-2 bg-surface-50 border-b border-surface-200">
            <span className="text-sm font-medium text-surface-600">MJML Source</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(template.mjmlCode)}
            >
              Copier
            </Button>
          </div>
          <pre className="p-4 text-xs text-surface-700 overflow-auto max-h-[600px] bg-surface-50">
            <code>{template.mjmlCode || 'Pas de code MJML disponible'}</code>
          </pre>
        </Card>
      )}

      {activeTab === 'specs' && (
        <div className="grid grid-cols-2 gap-6">
          <Card variant="bordered" padding="md">
            <h3 className="font-semibold text-surface-900 mb-3">Layout</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-surface-400">Structure</dt>
                <dd className="text-surface-700">{template.layoutDescription.structure}</dd>
              </div>
              <div>
                <dt className="text-surface-400">Hero</dt>
                <dd className="text-surface-700">{template.layoutDescription.heroSection}</dd>
              </div>
              <div>
                <dt className="text-surface-400">Body</dt>
                <dd className="text-surface-700">{template.layoutDescription.bodySections}</dd>
              </div>
              <div>
                <dt className="text-surface-400">CTA</dt>
                <dd className="text-surface-700">{template.layoutDescription.ctaSection}</dd>
              </div>
              <div>
                <dt className="text-surface-400">Footer</dt>
                <dd className="text-surface-700">{template.layoutDescription.footer}</dd>
              </div>
            </dl>
          </Card>

          <Card variant="bordered" padding="md">
            <h3 className="font-semibold text-surface-900 mb-3">Design Specs</h3>
            <dl className="space-y-2 text-sm">
              {Object.entries(template.designSpecs).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-surface-400">{key}</dt>
                  <dd className="text-surface-700">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card variant="bordered" padding="md">
            <h3 className="font-semibold text-surface-900 mb-3">Dark Mode</h3>
            <pre className="text-xs text-surface-600 whitespace-pre-wrap">{template.darkModeOverrides || 'Aucun'}</pre>
          </Card>

          <Card variant="bordered" padding="md">
            <h3 className="font-semibold text-surface-900 mb-3">Accessibilité</h3>
            <p className="text-sm text-surface-700">{template.accessibilityNotes || 'Aucune note'}</p>
            <h3 className="font-semibold text-surface-900 mt-4 mb-2">Cohérence</h3>
            <p className="text-sm text-surface-700">{template.coherenceTips || 'Aucun conseil'}</p>
          </Card>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

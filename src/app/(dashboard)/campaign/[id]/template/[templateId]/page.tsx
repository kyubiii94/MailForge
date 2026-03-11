'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { NewsletterTemplate, Campaign } from '@/types';
import { sanitizeHtmlForPreview } from '@/lib/utils';
import { Link2, Check, Trash2, Pencil } from 'lucide-react';

type Tab = 'preview' | 'html' | 'mjml' | 'specs';

/** Sanitize (scripts, invalid img src) and force light color-scheme for iframe preview. */
function getPreviewHtml(htmlCode: string): string {
  if (!htmlCode?.trim()) return '';
  const sanitized = sanitizeHtmlForPreview(htmlCode);
  return sanitized.replace(
    /<head(\s[^>]*)?>/i,
    (match) => `${match}<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">`
  );
}

/** True if the generated HTML looks complete enough to display. */
function isHtmlComplete(htmlCode: string): boolean {
  if (!htmlCode || htmlCode.trim().length < 800) return false;
  return /<body[\s>]/i.test(htmlCode) && /<table[\s>]/i.test(htmlCode);
}

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<NewsletterTemplate | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState<{ id: string; templateNumber: number; templateType: string }[]>([]);
  const [notFoundCampaign, setNotFoundCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function copyTemplateUrl() {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/campaign/${canonicalId}/template/${templateId}`;
    navigator.clipboard?.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  const fetchTemplate = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaign/${campaignId}/template/${templateId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExistingTemplates(Array.isArray(data.existingTemplates) ? data.existingTemplates : []);
        setNotFoundCampaign(data.campaign || null);
        setError(data.error || 'Template introuvable');
        return;
      }
      setTemplate(data.template);
      setCampaign(data.campaign);
      setError('');
      setExistingTemplates([]);
      setNotFoundCampaign(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes('Failed to fetch')
        ? 'Impossible de charger le template. Vérifiez votre connexion et que la campagne existe.'
        : `Chargement impossible : ${msg}`);
      setExistingTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, templateId]);

  useEffect(() => { fetchTemplate(); }, [fetchTemplate]);

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 95000);

      const res = await fetch(`/api/campaign/${campaignId}/template/${templateId}/regenerate`, {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let data: { template?: NewsletterTemplate; error?: string };
      try {
        data = await res.json();
      } catch {
        if (res.status >= 500) {
          setError('Le serveur a mis trop de temps à répondre (timeout possible sur Vercel). Réessayez ou régénérez un template à la fois.');
        } else {
          setError('Réponse serveur invalide. Réessayez.');
        }
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Erreur de régénération');
        if (res.status === 503 && data.error?.toLowerCase().includes('gemini')) {
          setError(`${data.error} Vérifiez GEMINI_API_KEY dans Vercel (Environment Variables).`);
        }
        return;
      }
      if (data.template) setTemplate(data.template);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('abort') || (err instanceof Error && err.name === 'AbortError')) {
        setError('La régénération a pris trop de temps. Sur Vercel (offre gratuite), la limite est d\'environ 60 secondes. Réessayez.');
      } else {
        setError('Erreur de connexion. Vérifiez votre réseau et que GEMINI_API_KEY est configurée (Vercel ou .env).');
      }
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleExport(format: 'html' | 'mjml') {
    window.open(`/api/campaign/${campaignId}/template/${templateId}/export?format=${format}`, '_blank');
  }

  async function handleDeleteTemplate() {
    if (!template || !campaign) return;
    if (!confirm(`Supprimer le template #${template.templateNumber} (${template.templateType}) ? Vous pourrez le régénérer depuis la fiche campagne.`)) return;
    setIsDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/campaign/${campaignId}/template/${templateId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Impossible de supprimer le template');
        return;
      }
      const canonicalId = campaign.id ?? campaignId;
      router.push(`/campaign/${canonicalId}`);
    } catch {
      setError('Erreur de connexion lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!template) {
    const canonicalId = notFoundCampaign?.id ?? campaignId;
    return (
      <div className="max-w-lg mx-auto py-16 space-y-6">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-left">
          <p className="font-medium text-amber-900">Template introuvable</p>
          <p className="text-sm text-amber-800 mt-1">
            Ce template n'existe pas ou n'a pas encore été généré. Accédez à la fiche campagne pour consulter les templates disponibles et en générer de nouveaux.
          </p>
          {existingTemplates.length > 0 && (
            <p className="text-sm text-amber-800 mt-2 pt-2 border-t border-amber-200">
              Templates déjà générés pour cette campagne&nbsp;:{' '}
              {existingTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => router.push(`/campaign/${canonicalId}/template/${t.id}`)}
                  className="inline-flex items-center justify-center rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium px-2 py-0.5 text-sm mr-1"
                >
                  #{t.templateNumber}
                </button>
              ))}
            </p>
          )}
          {error && (
            <p className="text-sm text-amber-700 mt-2 pt-2 border-t border-amber-200">{error}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => router.push(`/campaign/${canonicalId}`)}
          >
            Accéder à la fiche campagne
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/campaigns')}
          >
            Voir la liste des campagnes
          </Button>
        </div>
      </div>
    );
  }

  const canonicalId = campaign?.id ?? campaignId;

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
            onClick={() => router.push(`/campaign/${canonicalId}`)}
            className="text-sm text-surface-500 hover:text-surface-700 mb-2 inline-flex items-center gap-1"
          >
            ← Retour à la campagne
          </button>
          <h1 className="text-2xl font-bold text-surface-900">
            #{template.templateNumber} — {template.templateType}
          </h1>
          {campaign && <p className="text-surface-500 mt-1">{campaign.name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push(`/campaign/${canonicalId}/template/${templateId}/edit`)}
          >
            <Pencil className="w-4 h-4" />
            Modifier le template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyTemplateUrl}
            title="Copier l'URL pour accéder directement à ce template"
          >
            {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
            {linkCopied ? 'Lien copié' : 'Copier le lien'}
          </Button>
          <Button variant="outline" onClick={handleRegenerate} isLoading={isRegenerating}>
            Régénérer
          </Button>
          <Button variant="secondary" onClick={() => handleExport('html')}>
            Export HTML
          </Button>
          <Button variant="secondary" onClick={() => handleExport('mjml')}>
            Export MJML
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteTemplate}
            disabled={isDeleting}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            title="Supprimer ce template pour pouvoir le régénérer"
          >
            {isDeleting ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Supprimer
          </Button>
        </div>
      </div>

      {/* URL d'accès direct */}
      <div className="rounded-lg bg-surface-50 border border-surface-200 px-3 py-2 text-sm">
        <span className="text-surface-500">Lien direct : </span>
        <code className="text-surface-700 break-all">
          /campaign/{canonicalId}/template/{templateId}
        </code>
        <span className="text-surface-400 text-xs ml-2">(partagez ou enregistrez ce lien pour y accéder plus tard)</span>
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
          {!isHtmlComplete(template.htmlCode) && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <p className="font-medium">Contenu incomplet ou vide</p>
              <p className="mt-1">La génération n&apos;a pas produit de HTML utilisable (trop court ou vide). Cliquez sur <strong>Régénérer</strong> ci-dessous pour générer une newsletter complète (hero, texte, CTA, footer).</p>
              <div className="mt-3">
                <Button onClick={handleRegenerate} disabled={isRegenerating} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {isRegenerating ? 'Régénération…' : 'Régénérer ce template'}
                </Button>
              </div>
            </div>
          )}
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
                srcDoc={getPreviewHtml(template.htmlCode) || `<!DOCTYPE html><html><body style="margin:0;padding:24px;font-family:sans-serif;background:#f8f9fa;"><div style="max-width:400px;margin:0 auto;text-align:center;"><p style="color:#555;font-size:15px;">Aucun contenu HTML généré pour ce template.</p><p style="color:#888;font-size:13px;margin-top:8px;">Utilisez le bouton <strong>Régénérer</strong> au-dessus pour générer la newsletter.</p></div></body></html>`}
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
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm space-y-1">
          <p className="font-medium">Erreur</p>
          <p>{error}</p>
          {(error.includes('GEMINI') || error.includes('timeout') || error.includes('Vercel')) && (
            <p className="mt-2 text-red-600 text-xs">
              Vérifiez GEMINI_API_KEY dans Vercel (Environment Variables) et réessayez.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

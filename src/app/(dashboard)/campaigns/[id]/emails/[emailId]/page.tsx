'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getModuleDef } from '@/features/sfmc/modules/registry';
import { renderEmail } from '@/features/sfmc/render/render-email';
import { emailConfigSchema } from '@/features/sfmc/schemas/campaign';
import type { SfmcEmailConfig } from '@/features/sfmc/types';
import type { ModuleInstance } from '@/features/sfmc/modules/types';
import type { AdviceItem } from '@/features/sfmc/modules/advice';
import { AiPanel } from './ai-panel';
import {
  ArrowLeft,
  Save,
  Copy,
  Check,
  Download,
  Eye,
  Code2,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

type MainTab = 'preview' | 'code' | 'qa';
type CodeTab = 'package' | 'html' | 'ampscript' | 'ssjs' | 'cloudpage';

export default function EmailBuilderPage({
  params,
}: {
  params: { id: string; emailId: string };
}) {
  const { id, emailId } = params;
  const [config, setConfig] = useState<SfmcEmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>('preview');
  const [codeTab, setCodeTab] = useState<CodeTab>('package');
  const [showAi, setShowAi] = useState(false);

  const fetchEmail = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/emails/${emailId}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Email introuvable');
        return;
      }
      setConfig(data.email.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [emailId]);

  useEffect(() => {
    fetchEmail();
  }, [fetchEmail]);

  const rendered = useMemo(() => (config ? renderEmail(config) : null), [config]);
  const qaFailures = rendered ? rendered.qa.filter((q) => !q.ok).length : 0;

  const patchConfig = useCallback((patch: Partial<SfmcEmailConfig>) => {
    setSaved(false);
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const patchModule = useCallback((instId: string, props: Record<string, unknown>) => {
    setSaved(false);
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            modules: prev.modules.map((m) => (m.id === instId ? { ...m, props: { ...m.props, ...props } } : m)),
          }
        : prev
    );
  }, []);

  const toggleModule = useCallback((instId: string, enabled: boolean) => {
    setSaved(false);
    setConfig((prev) =>
      prev ? { ...prev, modules: prev.modules.map((m) => (m.id === instId ? { ...m, enabled } : m)) } : prev
    );
  }, []);

  const handleSave = async () => {
    if (!config) return;
    const parsed = emailConfigSchema.safeParse(config);
    if (!parsed.success) {
      setError('Configuration invalide : ' + JSON.stringify(parsed.error.flatten().fieldErrors));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/emails/${emailId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: parsed.data }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la sauvegarde');
        return;
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" aria-live="polite">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {error}
        </div>
        <Link href={`/campaigns/${id}`} className="inline-flex items-center gap-1.5 text-sm text-brand-600 mt-4">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
      </div>
    );
  }

  if (!config || !rendered) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href={`/campaigns/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la campagne
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAi((s) => !s)}>
            <Sparkles className="w-4 h-4" />
            Assistant IA
          </Button>
          <Button onClick={handleSave} isLoading={saving}>
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Enregistré' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {/* Bannière relecture obligatoire */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          <strong>Relecture obligatoire avant envoi.</strong> Le code SFMC est généré de façon déterministe. Vérifiez le
          rendu, l&apos;AMPscript et la checklist QA avant toute mise en production.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {showAi && (
        <AiPanel
          emailId={emailId}
          onApply={(s, structure) => {
            const patch: Partial<SfmcEmailConfig> = {};
            if (s.subject) patch.subject = s.subject;
            if (s.preheader) patch.preheader = s.preheader;
            if (s.utmTrigger) patch.utmTrigger = s.utmTrigger;
            setConfig((prev) => {
              if (!prev) return prev;

              const pool = prev.modules.map((m) => ({ ...m }));
              const take = (type: string) => {
                const idx = pool.findIndex((m) => m.type === type);
                if (idx === -1) return null;
                return pool.splice(idx, 1)[0];
              };

              const nextModules: typeof prev.modules = [];
              for (const type of structure.moduleOrder) {
                let mod = take(type);
                if (!mod) {
                  const def = getModuleDef(type);
                  if (!def) continue;
                  mod = {
                    id: `${type}-ai-${Date.now()}`,
                    type,
                    enabled: true,
                    props: { ...def.defaultProps },
                  };
                }
                let props = { ...mod.props };
                if (type === 'hero') {
                  props = {
                    ...props,
                    ...(s.heroTitle ? { title: s.heroTitle } : {}),
                    ...(s.heroText ? { text: s.heroText } : {}),
                  };
                }
                if (type === 'cta' && s.ctaLabel) {
                  props = { ...props, label: s.ctaLabel };
                }
                if (type === 'advice' && s.advice.length) {
                  props = {
                    ...props,
                    items: s.advice.map((a) => ({
                      img: 'https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/a385eb83-989c-4c47-bdd7-1df107a892e0.png',
                      title: a.title,
                      text: a.text,
                      linkLabel: a.linkLabel,
                      linkUrl: a.linkLabel ? '@fsrboLink' : '',
                    })),
                  };
                }
                if (type === 'article') {
                  props = {
                    ...props,
                    title: s.article.title || (props.title as string),
                    teaser: s.article.teaser || (props.teaser as string),
                    layout: structure.articleLayout || s.article.layout || 'horizontal',
                    link: (props.link as string) || '@articleLink',
                    img:
                      (props.img as string) ||
                      'https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/a385eb83-989c-4c47-bdd7-1df107a892e0.png',
                  };
                }
                nextModules.push({ ...mod, enabled: true, props });
              }

              for (const m of pool) {
                nextModules.push({ ...m, enabled: false });
              }

              return { ...prev, ...patch, modules: nextModules };
            });
            setSaved(false);
          }}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ─── Formulaire ─── */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-surface-800 mb-4">Métadonnées</h2>
            <div className="space-y-3">
              <Input label="Nom de l'email" value={config.name} onChange={(e) => patchConfig({ name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Étape séquence"
                  value={config.sequenceStep}
                  onChange={(e) => patchConfig({ sequenceStep: e.target.value })}
                  hint="Ex. J1, J30, E2"
                />
                <Input
                  label="Réf. footer"
                  value={config.footerRef}
                  onChange={(e) => patchConfig({ footerRef: e.target.value })}
                />
              </div>
              <Input label="Objet" value={config.subject} onChange={(e) => patchConfig({ subject: e.target.value })} />
              <Input
                label="Pré-header"
                value={config.preheader}
                onChange={(e) => patchConfig({ preheader: e.target.value })}
              />
              <Input
                label="Trigger UTM"
                value={config.utmTrigger}
                onChange={(e) => patchConfig({ utmTrigger: e.target.value.toLowerCase() })}
                hint="Minuscules — intégré à utm_campaign"
              />
              <label className="flex items-center gap-2 text-sm text-surface-700 pt-1">
                <input
                  type="checkbox"
                  checked={config.cloudPage}
                  onChange={(e) => patchConfig({ cloudPage: e.target.checked })}
                  className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                Générer les artefacts CloudPage + SSJS
              </label>
            </div>
          </Card>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-surface-800">Modules</h2>
            {config.modules.map((inst) => (
              <ModuleEditor
                key={inst.id}
                instance={inst}
                onToggle={(en) => toggleModule(inst.id, en)}
                onChange={(props) => patchModule(inst.id, props)}
              />
            ))}
          </div>
        </div>

        {/* ─── Aperçu / Code / QA ─── */}
        <div className="lg:sticky lg:top-4 space-y-3">
          <div className="flex gap-1 p-1 bg-surface-100 rounded-lg" role="tablist">
            <TabButton active={mainTab === 'preview'} onClick={() => setMainTab('preview')} icon={Eye} label="Aperçu" />
            <TabButton active={mainTab === 'code'} onClick={() => setMainTab('code')} icon={Code2} label="Code" />
            <TabButton
              active={mainTab === 'qa'}
              onClick={() => setMainTab('qa')}
              icon={ClipboardCheck}
              label={`QA${qaFailures ? ` (${qaFailures})` : ''}`}
            />
          </div>

          {mainTab === 'preview' && (
            <Card padding="none" className="overflow-hidden">
              <iframe
                title="Aperçu de l'email"
                srcDoc={rendered.preview}
                className="w-full h-[70vh] bg-white"
                sandbox=""
              />
            </Card>
          )}

          {mainTab === 'code' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {(['package', 'html', 'ampscript', 'ssjs', 'cloudpage'] as CodeTab[]).map((t) => {
                  const disabled = (t === 'ssjs' || t === 'cloudpage') && !config.cloudPage;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      onClick={() => setCodeTab(t)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                        codeTab === t ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
                        disabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {t === 'package' ? 'Package' : t.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <CodeView
                code={
                  codeTab === 'package'
                    ? rendered.package
                    : codeTab === 'html'
                      ? rendered.html
                      : codeTab === 'ampscript'
                        ? rendered.ampscript
                        : codeTab === 'ssjs'
                          ? rendered.ssjs
                          : rendered.cloudPage
                }
                downloadUrl={`/api/emails/${emailId}/export?format=${codeTab}&download=1`}
              />
              <p className="text-xs text-surface-400">
                Le téléchargement utilise la dernière version <strong>enregistrée</strong>. Pensez à enregistrer avant.
              </p>
            </div>
          )}

          {mainTab === 'qa' && (
            <Card>
              <h3 className="text-sm font-semibold text-surface-800 mb-3">Checklist QA</h3>
              <ul className="space-y-2">
                {rendered.qa.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {q.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className="font-medium text-surface-800">{q.label}</span>
                      <p className="text-xs text-surface-500">{q.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Eye;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        active ? 'bg-white text-brand-700 shadow-sm' : 'text-surface-600 hover:text-surface-900'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function CodeView({ code, downloadUrl }: { code: string; downloadUrl: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponible */
    }
  };
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-100 bg-surface-50">
        <span className="text-xs text-surface-500">{code.length} caractères</span>
        <div className="flex items-center gap-2">
          <a
            href={downloadUrl}
            className="inline-flex items-center gap-1 text-xs text-surface-600 hover:text-brand-600"
          >
            <Download className="w-3.5 h-3.5" /> Télécharger
          </a>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>
      <pre className="p-3 text-[11px] leading-relaxed overflow-auto max-h-[62vh] bg-surface-900 text-surface-100">
        <code>{code || '(vide)'}</code>
      </pre>
    </Card>
  );
}

function ModuleEditor({
  instance,
  onToggle,
  onChange,
}: {
  instance: ModuleInstance;
  onToggle: (enabled: boolean) => void;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const def = getModuleDef(instance.type);
  if (!def) return null;
  const props = { ...def.defaultProps, ...instance.props } as Record<string, unknown>;

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-surface-800">{def.label}</h3>
        {def.toggleable && (
          <label className="flex items-center gap-2 text-xs text-surface-600">
            <input
              type="checkbox"
              checked={instance.enabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            {instance.enabled ? 'Activé' : 'Désactivé'}
          </label>
        )}
      </div>

      {instance.enabled && (
        <div className="space-y-3">
          {def.fields.map((f) => {
            const value = (props[f.key] as string) ?? '';
            if (f.kind === 'textarea') {
              return (
                <Textarea
                  key={f.key}
                  label={f.label}
                  value={value}
                  hint={f.hint}
                  placeholder={f.placeholder}
                  onChange={(e) => onChange({ [f.key]: e.target.value })}
                />
              );
            }
            if (f.kind === 'select') {
              return (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">{f.label}</label>
                  <select
                    value={value}
                    onChange={(e) => onChange({ [f.key]: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return (
              <Input
                key={f.key}
                label={f.label}
                value={value}
                hint={f.hint}
                placeholder={f.placeholder}
                onChange={(e) => onChange({ [f.key]: e.target.value })}
              />
            );
          })}

          {instance.type === 'advice' && (
            <AdviceItemsEditor
              items={(props.items as AdviceItem[]) ?? []}
              onChange={(items) => onChange({ items })}
            />
          )}

          {instance.type === 'price-card' && (
            <p className="text-xs text-surface-500">
              Ce module lit automatiquement les attributs de la Data Extension estimation (@displaySellPrice,
              @estateTypeFR…). Rien à saisir.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function AdviceItemsEditor({
  items,
  onChange,
}: {
  items: AdviceItem[];
  onChange: (items: AdviceItem[]) => void;
}) {
  const update = (i: number, patch: Partial<AdviceItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const add = () =>
    onChange([
      ...items,
      {
        img: 'https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/a385eb83-989c-4c47-bdd7-1df107a892e0.png',
        title: '',
        text: '',
        linkLabel: '',
        linkUrl: '',
      },
    ]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-surface-600">Conseils ({items.length})</span>
        <Button type="button" variant="ghost" size="sm" onClick={add}>
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>
      {items.map((it, i) => (
        <div key={i} className="p-3 rounded-lg border border-surface-200 space-y-2 bg-surface-50">
          <div className="flex items-center justify-between">
            <Badge variant="default">Conseil {i + 1}</Badge>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-red-500 hover:text-red-700"
              aria-label={`Supprimer le conseil ${i + 1}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Input label="Titre" value={it.title} onChange={(e) => update(i, { title: e.target.value })} />
          <Textarea label="Texte" value={it.text} onChange={(e) => update(i, { text: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Libellé lien" value={it.linkLabel} onChange={(e) => update(i, { linkLabel: e.target.value })} />
            <Input label="URL / token" value={it.linkUrl} onChange={(e) => update(i, { linkUrl: e.target.value })} />
          </div>
        </div>
      ))}
    </div>
  );
}

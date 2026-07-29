'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CAMPAIGN_TYPES, PRESET_CATEGORIES } from '@/features/sfmc/presets';
import { createCampaignSchema } from '@/features/sfmc/schemas/campaign';
import type { SfmcCampaignType, SfmcPresetCategory } from '@/features/sfmc/types';
import { cn } from '@/lib/utils';
import { ArrowLeft, Mail } from 'lucide-react';

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [brief, setBrief] = useState('');
  const [category, setCategory] = useState<SfmcPresetCategory>('newsletter');
  const [type, setType] = useState<SfmcCampaignType>('newsletter-crm');
  const [errors, setErrors] = useState<{ name?: string; brief?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const typesInCategory = useMemo(
    () => CAMPAIGN_TYPES.filter((t) => t.category === category),
    [category]
  );

  const selectCategory = (next: SfmcPresetCategory) => {
    setCategory(next);
    const first = CAMPAIGN_TYPES.find((t) => t.category === next);
    if (first) setType(first.type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const parsed = createCampaignSchema.safeParse({ name, type, brief });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({ name: fieldErrors.name?.[0], brief: fieldErrors.brief?.[0] });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fieldMsg =
          data?.errors?.fieldErrors &&
          Object.values(data.errors.fieldErrors as Record<string, string[]>)
            .flat()
            .filter(Boolean)[0];
        setServerError(data.error || fieldMsg || 'Erreur lors de la création.');
        return;
      }
      router.push(`/campaigns/${data.campaign.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux campagnes
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-surface-900">Brief SeLoger</h1>
        <p className="text-surface-500 mt-1">
          Créez uniquement des emails et newsletters SeLoger, prêts pour Salesforce Marketing Cloud.
        </p>
      </div>

      <Card className="bg-brand-50/50 border-brand-100">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm text-surface-700">
            <p className="font-medium text-surface-900">Plateforme mono-client SeLoger</p>
            <p className="mt-1 text-surface-600">
              Pas de marque générique, pas d&apos;éditeur MJML : le brief génère des emails HTML + AMPscript
              conformes à la charte SeLoger (CeraSL, rouge #E30513, footer légal).
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card className="space-y-4">
          <Input
            label="Nom de la campagne"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Newsletter CRM — mars 2026"
            error={errors.name}
            required
          />
          <Textarea
            label="Brief (optionnel)"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Objectif, audience, ton, offre… Ex. Relancer les vendeurs FSBO après estimation, ton rassurant, CTA estimation."
            hint="Ce brief sert de contexte éditorial SeLoger (assistant IA et relecture). Il ne génère jamais de code SFMC."
            error={errors.brief}
            maxChars={2000}
            charCount
          />
        </Card>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-surface-700">Type d&apos;envoi SeLoger</legend>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Catégories">
            {PRESET_CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500',
                    active
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-surface-500">
            {PRESET_CATEGORIES.find((c) => c.id === category)?.description}
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {typesInCategory.map((t) => {
              const active = type === t.type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  aria-pressed={active}
                  className={cn(
                    'text-left p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
                    active
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-surface-200 hover:border-surface-300 bg-white'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg" aria-hidden>
                      {t.icon}
                    </span>
                    <span className="text-sm font-semibold text-surface-900">{t.label}</span>
                  </div>
                  <p className="text-xs text-surface-500">{t.description}</p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {serverError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
            {serverError}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={submitting}>
            <Mail className="w-4 h-4" />
            Générer les emails SeLoger
          </Button>
        </div>
      </form>
    </div>
  );
}

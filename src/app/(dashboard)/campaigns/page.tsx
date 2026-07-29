'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { CAMPAIGN_TYPES } from '@/features/sfmc/presets';
import type { SfmcCampaign } from '@/features/sfmc/types';
import { FolderOpen, Plus, ArrowRight, Building2 } from 'lucide-react';

const typeLabel = new Map(CAMPAIGN_TYPES.map((t) => [t.type, `${t.icon} ${t.label}`]));

const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
  draft: { label: 'Brouillon', variant: 'default' },
  ready: { label: 'Prête', variant: 'success' },
  exported: { label: 'Exportée', variant: 'info' },
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<SfmcCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/campaigns', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : []);
      if (!res.ok) setError(data.error || `Erreur ${res.status} : impossible de charger les campagnes.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes('Failed to fetch')
          ? 'Impossible de joindre le serveur. Vérifiez votre connexion et DATABASE_URL.'
          : `Erreur : ${msg}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          <p className="font-medium">Erreur</p>
          <p>{error}</p>
          <button type="button" onClick={() => fetchCampaigns()} className="mt-2 text-red-600 underline text-xs">
            Réessayer
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-brand-600" />
            Campagnes SeLoger
          </h1>
          <p className="text-surface-500 mt-1">
            Emails et newsletters SeLoger pour Salesforce Marketing Cloud.
          </p>
        </div>
        <Button onClick={() => router.push('/campaigns/new')}>
          <Plus className="w-4 h-4" />
          Nouveau brief
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16" aria-live="polite">
          <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-700 mb-2">Aucune campagne</h3>
          <p className="text-sm text-surface-500 mb-4">
            Créez votre premier brief pour générer des emails ou newsletters SeLoger.
          </p>
          <Button onClick={() => router.push('/campaigns/new')}>
            <Plus className="w-4 h-4" />
            Nouveau brief
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const status = statusMap[campaign.status] || statusMap.draft;
            return (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="group">
                <Card className="hover:shadow-md hover:border-surface-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-surface-900 group-hover:text-brand-600 transition-colors">
                          {campaign.name}
                        </h3>
                        <p className="text-xs text-surface-400 mt-0.5">
                          {typeLabel.get(campaign.type) ?? campaign.type} — créée le {formatDate(campaign.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-brand-600 transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Campaign } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  FolderOpen,
  Plus,
  ArrowRight,
  Mail,
} from 'lucide-react';

const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
  draft: { label: 'Brouillon', variant: 'default' },
  dna_ready: { label: 'ADN prêt', variant: 'info' },
  generating: { label: 'Génération...', variant: 'warning' },
  generated: { label: 'Générée', variant: 'success' },
  exported: { label: 'Exportée', variant: 'success' },
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setError(null);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCampaigns(data.campaigns || []);
      } else {
        setError(data.error || `Erreur ${res.status} : impossible de charger les campagnes.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes('Failed to fetch')
        ? 'Impossible de joindre le serveur. Vérifiez votre connexion et que DATABASE_URL est configurée.'
        : `Erreur : ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
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
            Campagnes
          </h1>
          <p className="text-surface-500 mt-1">
            Vos campagnes newsletter générées par IA.
          </p>
        </div>
        <Button onClick={() => router.push('/brief')}>
          <Plus className="w-4 h-4" />
          Nouvelle Campagne
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-700 mb-2">Aucune campagne</h3>
          <p className="text-sm text-surface-500 mb-4">
            Créez votre première campagne en remplissant un brief.
          </p>
          <Button onClick={() => router.push('/brief')}>
            <Plus className="w-4 h-4" />
            Créer une campagne
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const status = statusMap[campaign.status] || statusMap.draft;

            return (
              <Link
                key={campaign.id}
                href={`/campaign/${campaign.id}`}
                className="group"
              >
                <Card className="hover:shadow-md hover:border-surface-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-surface-900 group-hover:text-brand-600 transition-colors">
                          {campaign.name}
                        </h3>
                        <p className="text-xs text-surface-400 mt-0.5">
                          Créée le {formatDate(campaign.createdAt)}
                          {campaign.selectedTemplateTypes?.length > 0 && (
                            <> — {campaign.selectedTemplateTypes.length} template{campaign.selectedTemplateTypes.length > 1 ? 's' : ''}</>
                          )}
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

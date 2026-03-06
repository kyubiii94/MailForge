'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Campaign, BrandDNA } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  FolderOpen,
  Plus,
  ArrowRight,
  Mail,
  AlertCircle,
} from 'lucide-react';

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

const statusMap = {
  draft: { label: 'Brouillon', variant: 'default' as const },
  generating: { label: 'Génération', variant: 'warning' as const },
  review: { label: 'En revue', variant: 'info' as const },
  exported: { label: 'Exporté', variant: 'success' as const },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaigns();
    fetchBrandDNA();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`/api/campaigns?workspaceId=${DEFAULT_WORKSPACE_ID}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch {
      // Silently fail for now
    }
  };

  const fetchBrandDNA = async () => {
    try {
      const res = await fetch(`/api/brand-dna?workspaceId=${DEFAULT_WORKSPACE_ID}`);
      if (res.ok) {
        const data = await res.json();
        setBrandDNA(data);
      }
    } catch {
      // Silently fail
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    if (!brandDNA) {
      setError('Veuillez d\'abord analyser l\'ADN de votre marque.');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEFAULT_WORKSPACE_ID,
          brandDnaId: brandDNA.id,
          name: newCampaignName.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to create campaign');

      const campaign = await res.json();
      setCampaigns((prev) => [campaign, ...prev]);
      setNewCampaignName('');
      setShowCreateForm(false);
    } catch {
      setError('Erreur lors de la création de la campagne.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            <FolderOpen className="w-7 h-7 text-brand-600" />
            Campagnes
          </h1>
          <p className="text-surface-500 mt-1">
            Gérez vos campagnes email marketing.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4" />
          Nouvelle Campagne
        </Button>
      </div>

      {/* No Brand DNA warning */}
      {!brandDNA && (
        <Card className="border-yellow-200 bg-yellow-50" padding="md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">ADN de marque requis</p>
              <p className="text-sm text-yellow-600 mt-1">
                Analysez d&apos;abord l&apos;ADN de votre marque pour créer des campagnes.
              </p>
              <Link href="/brand-dna" className="text-sm font-medium text-yellow-700 underline mt-2 inline-block">
                Analyser mon site →
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Create form */}
      {showCreateForm && (
        <Card variant="elevated" padding="lg">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Nouvelle Campagne</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Nom de la campagne (ex: Newsletter Mars 2026)"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCampaign()}
              />
            </div>
            <Button onClick={handleCreateCampaign} isLoading={isCreating}>
              Créer
            </Button>
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
              Annuler
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </Card>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-700 mb-2">Aucune campagne</h3>
          <p className="text-sm text-surface-500">
            Créez votre première campagne pour commencer.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const status = statusMap[campaign.status];

            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}/text`}
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

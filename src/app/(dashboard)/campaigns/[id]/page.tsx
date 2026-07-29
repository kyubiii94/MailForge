'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CAMPAIGN_TYPES } from '@/features/sfmc/presets';
import type { SfmcCampaign, SfmcEmail } from '@/features/sfmc/types';
import { ArrowLeft, Mail, ChevronRight, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

const typeLabel = new Map(CAMPAIGN_TYPES.map((t) => [t.type, `${t.icon} ${t.label}`]));

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [campaign, setCampaign] = useState<SfmcCampaign | null>(null);
  const [emails, setEmails] = useState<SfmcEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Campagne introuvable');
        return;
      }
      setCampaign(data.campaign);
      setEmails(Array.isArray(data.emails) ? data.emails : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement cette campagne et tous ses emails ?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/campaigns');
      else setError('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" aria-live="polite">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
          {error || 'Campagne introuvable'}
        </div>
        <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-brand-600 mt-4">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800">
        <ArrowLeft className="w-4 h-4" />
        Retour aux campagnes
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{campaign.name}</h1>
          <p className="text-surface-500 mt-1">{typeLabel.get(campaign.type) ?? campaign.type}</p>
        </div>
        <Button variant="ghost" onClick={handleDelete} isLoading={deleting} className="text-red-600 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
          Supprimer
        </Button>
      </div>

      {campaign.brief ? (
        <Card padding="sm" className="bg-surface-50">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">Brief SeLoger</p>
          <p className="text-sm text-surface-700 whitespace-pre-wrap">{campaign.brief}</p>
        </Card>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
          Emails ({emails.length})
        </h2>
        <div className="grid gap-3">
          {emails.map((email) => {
            const failures = email.rendered.qa.filter((q) => !q.ok).length;
            return (
              <Link key={email.id} href={`/campaigns/${id}/emails/${email.id}`} className="group">
                <Card padding="sm" className="hover:shadow-md hover:border-surface-300 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 truncate group-hover:text-brand-600">
                          {email.config.name}
                        </p>
                        <p className="text-xs text-surface-400 truncate">
                          {email.config.sequenceStep} — {email.config.subject}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {failures === 0 ? (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> QA OK
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3 mr-1" /> {failures} alerte{failures > 1 ? 's' : ''}
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-brand-600" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

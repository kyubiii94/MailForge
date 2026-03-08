'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Client, Campaign } from '@/types';
import { formatDate } from '@/lib/utils';
import { Building2, Plus, ArrowRight, Mail } from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error('Client introuvable');
      const data = await res.json();
      setClient(data.client);
      setCampaigns(data.campaigns || []);
    } catch {
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-500">Client introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/clients')}>Retour aux clients</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/clients" className="text-sm text-surface-500 hover:text-surface-700 mb-2 inline-block">← Clients</Link>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-brand-600" />
            {client.name}
          </h1>
          <p className="text-surface-500 mt-1">{client.sector || '—'} · {client.positioning || '—'}</p>
        </div>
        <Link href={`/brief?clientId=${client.id}`}>
          <Button>
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </Button>
        </Link>
      </div>

      <Card variant="elevated" padding="lg">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Informations</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-surface-400">Site web</dt><dd className="text-surface-700">{client.website || '—'}</dd></div>
          <div><dt className="text-surface-400">Notes</dt><dd className="text-surface-700">{client.notes || '—'}</dd></div>
        </dl>
        <p className="text-xs text-surface-400 mt-4">Créé le {formatDate(client.createdAt)}</p>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Campagnes associées</h2>
        {campaigns.length === 0 ? (
          <Card variant="bordered" padding="md">
            <p className="text-surface-500 text-center py-6">Aucune campagne pour ce client.</p>
            <div className="flex justify-center">
              <Link href={`/brief?clientId=${client.id}`}>
                <Button variant="outline">Créer une campagne</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((c) => (
              <Link key={c.id} href={`/campaign/${c.id}`}>
                <Card className="hover:shadow-md hover:border-surface-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-surface-900">{c.name}</h3>
                        <p className="text-xs text-surface-400">{formatDate(c.createdAt)}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-surface-400" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

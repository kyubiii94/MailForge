'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Client } from '@/types';
import { formatDate } from '@/lib/utils';
import { Users, Plus, ArrowRight, Building2 } from 'lucide-react';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setError(null);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setClients(data.clients || []);
      } else {
        setError(data.error || `Erreur ${res.status} : impossible de charger les clients.`);
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
          <button type="button" onClick={() => fetchClients()} className="mt-2 text-red-600 underline text-xs">
            Réessayer
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-brand-600" />
            Clients
          </h1>
          <p className="text-surface-500 mt-1">
            Gérez vos clients et associez-les à vos campagnes newsletter.
          </p>
        </div>
        <Button onClick={() => router.push('/clients/new')}>
          <Plus className="w-4 h-4" />
          Nouveau client
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-700 mb-2">Aucun client</h3>
          <p className="text-sm text-surface-500 mb-4">
            Créez votre premier client pour associer vos campagnes à une marque.
          </p>
          <Button onClick={() => router.push('/clients/new')}>
            <Plus className="w-4 h-4" />
            Créer un client
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`} className="group">
              <Card className="hover:shadow-md hover:border-surface-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-surface-900 group-hover:text-brand-600 transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-xs text-surface-400 mt-0.5">
                        {client.sector || '—'} · Créé le {formatDate(client.createdAt)}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-brand-600 transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

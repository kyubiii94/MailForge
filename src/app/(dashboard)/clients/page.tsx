'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Client } from '@/types';
import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  Users,
  Plus,
  ArrowRight,
  Globe,
  Building2,
} from 'lucide-react';

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const setClientsStore = useWorkspaceStore((s) => s.setClients);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch(`/api/clients?workspaceId=${DEFAULT_WORKSPACE_ID}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        setClientsStore(data);
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-brand-600" />
            Clients
          </h1>
          <p className="text-surface-500 mt-1">
            Gérez vos clients et leurs identités de marque.
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="w-4 h-4" />
            Nouveau Client
          </Button>
        </Link>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-surface-700 mb-2">Aucun client</h3>
          <p className="text-sm text-surface-500 mb-6">
            Créez votre premier client pour commencer à générer des campagnes.
          </p>
          <Link href="/clients/new">
            <Button>
              <Plus className="w-4 h-4" />
              Créer un client
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="group"
            >
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
                        {client.sector}
                        {client.positioning && ` — ${client.positioning}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {client.website && (
                      <Badge variant="info">
                        <Globe className="w-3 h-3 mr-1" />
                        Site web
                      </Badge>
                    )}
                    <Badge>{client.toneOfVoice?.style || 'Non défini'}</Badge>
                    <ArrowRight className="w-4 h-4 text-surface-400 group-hover:text-brand-600 transition-colors" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

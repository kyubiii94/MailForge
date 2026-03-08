'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Client, Campaign } from '@/types';
import { formatDate } from '@/lib/utils';
import { Building2, Plus, ArrowRight, Mail, Globe, RefreshCw, Palette, Type, Users, Tag, Sparkles } from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

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

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch(`/api/clients/${id}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'analyse');
      setClient(data.client);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setAnalyzing(false);
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

  const analysis = client.siteAnalysis;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/clients" className="text-sm text-surface-500 hover:text-surface-700 mb-2 inline-block">&larr; Clients</Link>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-brand-600" />
            {client.name}
          </h1>
          <p className="text-surface-500 mt-1">{client.sector || '\u2014'} &middot; {client.positioning || '\u2014'}</p>
        </div>
        <Link href={`/brief?clientId=${client.id}`}>
          <Button>
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </Button>
        </Link>
      </div>

      {/* Informations */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900">Informations</h2>
          {client.website && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  {analysis ? 'Reanalyser le site' : 'Analyser le site'}
                </>
              )}
            </Button>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-surface-400">Site web</dt>
            <dd className="text-surface-700">
              {client.website ? (
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  {client.website}
                </a>
              ) : '\u2014'}
            </dd>
          </div>
          <div><dt className="text-surface-400">Notes</dt><dd className="text-surface-700">{client.notes || '\u2014'}</dd></div>
        </dl>
        <p className="text-xs text-surface-400 mt-4">Créé le {formatDate(client.createdAt)}</p>

        {analyzeError && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{analyzeError}</p>
        )}
      </Card>

      {/* Site Analysis Results */}
      {analysis && (
        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-surface-900">Analyse du site</h2>
            <span className="text-xs text-surface-400 ml-auto">Analysé le {formatDate(analysis.analyzedAt)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Palette */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                <Palette className="w-4 h-4 text-brand-500" />
                Palette de couleurs
              </div>
              <p className="text-sm text-surface-600 bg-surface-50 rounded-lg px-3 py-2">{analysis.colors}</p>
            </div>

            {/* Typographie */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                <Type className="w-4 h-4 text-brand-500" />
                Typographie
              </div>
              <p className="text-sm text-surface-600 bg-surface-50 rounded-lg px-3 py-2">{analysis.fonts}</p>
            </div>

            {/* Ton de voix */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                <Tag className="w-4 h-4 text-brand-500" />
                Ton de voix
              </div>
              <p className="text-sm text-surface-600 bg-surface-50 rounded-lg px-3 py-2">{analysis.toneOfVoice}</p>
            </div>

            {/* Audience */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                <Users className="w-4 h-4 text-brand-500" />
                Audience cible
              </div>
              <p className="text-sm text-surface-600 bg-surface-50 rounded-lg px-3 py-2">{analysis.audience}</p>
            </div>

            {/* Ambiance */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Ambiance
              </div>
              <p className="text-sm text-surface-600 bg-surface-50 rounded-lg px-3 py-2">{analysis.ambiance}</p>
            </div>

            {/* Mots-clés */}
            {analysis.keywords && analysis.keywords.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                  <Tag className="w-4 h-4 text-brand-500" />
                  Mots-clés
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map((kw, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Campagnes */}
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

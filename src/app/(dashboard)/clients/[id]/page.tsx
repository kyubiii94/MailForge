'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { Client, BrandDNA, Campaign } from '@/types';
import {
  Building2,
  ArrowLeft,
  Globe,
  Dna,
  FolderOpen,
  MessageSquare,
  Settings,
  Save,
  Loader2,
  Plus,
} from 'lucide-react';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const setCurrentClient = useWorkspaceStore((s) => s.setCurrentClient);

  const [client, setClient] = useState<Client | null>(null);
  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable fields
  const [positioning, setPositioning] = useState('');
  const [toneStyle, setToneStyle] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) throw new Error('Client not found');
      const data: Client = await res.json();
      setClient(data);
      setCurrentClient(data);
      setPositioning(data.positioning || '');
      setToneStyle(data.toneOfVoice?.style || '');
      setNotes(data.notes || '');

      // Fetch brand DNA for this client
      const dnaRes = await fetch(`/api/brand-dna?clientId=${clientId}`);
      if (dnaRes.ok) {
        const dnaData = await dnaRes.json();
        setBrandDNA(dnaData);
      }

      // Fetch campaigns for this client
      const campRes = await fetch(`/api/campaigns?workspaceId=${data.workspaceId}&clientId=${clientId}`);
      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaigns(campData);
      }
    } catch {
      setError('Impossible de charger le client.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positioning,
          toneOfVoice: {
            ...client.toneOfVoice,
            style: toneStyle,
          },
          notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setClient(updated);
      setCurrentClient(updated);
      setSuccessMsg('Client mis à jour avec succès.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setError('Erreur lors de la mise à jour.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-500">Client introuvable.</p>
        <Link href="/clients" className="text-brand-600 underline mt-2 inline-block">
          Retour aux clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <Link href="/clients" className="text-sm text-surface-500 hover:text-surface-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Retour aux clients
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
              <Building2 className="w-7 h-7 text-brand-600" />
              {client.name}
            </h1>
            <p className="text-surface-500 mt-1">
              {client.sector}
              {client.website && (
                <> &middot; <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{client.website}</a></>
              )}
            </p>
          </div>
          <Button onClick={handleSave} isLoading={isSaving}>
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Success / Error messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">{successMsg}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Quick info */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Dna className="w-5 h-5 text-brand-500" />
            <div>
              <p className="text-xs text-surface-400">ADN de Marque</p>
              <p className="text-sm font-medium text-surface-900">
                {brandDNA ? 'Analysé' : 'Non analysé'}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-brand-500" />
            <div>
              <p className="text-xs text-surface-400">Campagnes</p>
              <p className="text-sm font-medium text-surface-900">{campaigns.length}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-brand-500" />
            <div>
              <p className="text-xs text-surface-400">ESP</p>
              <p className="text-sm font-medium text-surface-900">
                {client.technicalPrefs?.esp || 'Non défini'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Editable fields */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Positionnement & Ton</CardTitle>
          <CardDescription>Ces informations enrichissent les prompts IA pour vos campagnes.</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <Input
            label="Positionnement"
            value={positioning}
            onChange={(e) => setPositioning(e.target.value)}
            placeholder="ex: Mode éthique premium pour femmes actives"
          />
          <Input
            label="Style de ton"
            value={toneStyle}
            onChange={(e) => setToneStyle(e.target.value)}
            placeholder="ex: Chaleureux et accessible"
          />
          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Notes libres..."
          />
        </div>
      </Card>

      {/* Tone of Voice details */}
      {client.toneOfVoice && (client.toneOfVoice.do.length > 0 || client.toneOfVoice.dont.length > 0) && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-500" />
              Ton de voix — Do / Don&apos;t
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-green-700 mb-2">À faire</p>
              <div className="flex flex-wrap gap-2">
                {client.toneOfVoice.do.map((item) => (
                  <Badge key={item} variant="success">{item}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-red-700 mb-2">À éviter</p>
              <div className="flex flex-wrap gap-2">
                {client.toneOfVoice.dont.map((item) => (
                  <Badge key={item} variant="warning">{item}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Brand DNA inline */}
      {brandDNA && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dna className="w-5 h-5 text-brand-500" />
              ADN de Marque
            </CardTitle>
            <CardDescription>
              Extrait de <a href={brandDNA.siteUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{brandDNA.siteUrl}</a>
            </CardDescription>
          </CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-surface-400 mb-1">Ton</p>
              <Badge variant="success">{brandDNA.editorialTone.tone}</Badge>
            </div>
            <div>
              <p className="text-xs text-surface-400 mb-1">Mots-clés</p>
              <div className="flex flex-wrap gap-1">
                {brandDNA.keywords.keywords.slice(0, 5).map((k) => (
                  <Badge key={k} variant="info">{k}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Campaigns */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand-500" />
            Campagnes ({campaigns.length})
          </CardTitle>
        </CardHeader>
        {campaigns.length === 0 ? (
          <p className="text-sm text-surface-400">Aucune campagne pour ce client.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <Link key={c.id} href={`/campaigns/${c.id}/text`} className="block">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-50 transition-colors">
                  <span className="text-sm font-medium text-surface-800">{c.name}</span>
                  <Badge variant={c.status === 'exported' ? 'success' : 'default'}>{c.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Launch Brand DNA if not yet done */}
      {!brandDNA && client.website && (
        <Card className="border-brand-200 bg-brand-50" padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-800">
                Analysez l&apos;ADN de marque de {client.name}
              </p>
              <p className="text-sm text-brand-600 mt-1">
                Lancez l&apos;extraction automatique depuis {client.website}
              </p>
            </div>
            <Link href={`/brand-dna?clientId=${client.id}&url=${encodeURIComponent(client.website)}`}>
              <Button>
                <Dna className="w-4 h-4" />
                Analyser
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

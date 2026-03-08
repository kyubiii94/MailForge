'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWorkspaceStore } from '@/stores/workspace-store';
import {
  Users,
  ArrowLeft,
  Globe,
  MessageSquare,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

const ESP_OPTIONS = [
  { value: '', label: 'Non défini' },
  { value: 'mailchimp', label: 'Mailchimp' },
  { value: 'klaviyo', label: 'Klaviyo' },
  { value: 'brevo', label: 'Brevo' },
  { value: 'other', label: 'Autre' },
];

export default function NewClientPage() {
  const router = useRouter();
  const addClient = useWorkspaceStore((s) => s.addClient);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [positioning, setPositioning] = useState('');
  const [website, setWebsite] = useState('');
  const [toneStyle, setToneStyle] = useState('');
  const [toneDo, setToneDo] = useState('');
  const [toneDont, setToneDont] = useState('');
  const [esp, setEsp] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sector.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: DEFAULT_WORKSPACE_ID,
          name: name.trim(),
          sector: sector.trim(),
          positioning: positioning.trim(),
          website: website.trim() || null,
          toneOfVoice: {
            style: toneStyle.trim(),
            language: ['fr'],
            do: toneDo ? toneDo.split(',').map((s) => s.trim()).filter(Boolean) : [],
            dont: toneDont ? toneDont.split(',').map((s) => s.trim()).filter(Boolean) : [],
          },
          technicalPrefs: {
            esp: esp || null,
            mergeTagsFormat: esp === 'klaviyo' ? '{{ TAG }}' : esp === 'brevo' ? '{{ params.TAG }}' : '*|TAG|*',
            darkMode,
            languages: ['fr'],
          },
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create client');
      }

      const client = await res.json();
      addClient(client);
      router.push(`/clients/${client.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <Link href="/clients" className="text-sm text-surface-500 hover:text-surface-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Retour aux clients
        </Link>
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
          <Users className="w-7 h-7 text-brand-600" />
          Nouveau Client
        </h1>
        <p className="text-surface-500 mt-1">
          Créez une fiche client pour centraliser l&apos;identité de marque.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Identité</CardTitle>
            <CardDescription>Informations de base sur le client.</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label="Nom du client *"
              placeholder="ex: Sézane, Asphalte, Le Slip Français..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Secteur *"
              placeholder="ex: Mode, Beauté, Tech, Food, SaaS..."
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
            />
            <Input
              label="Positionnement"
              placeholder="ex: Mode éthique haut de gamme pour femmes actives"
              value={positioning}
              onChange={(e) => setPositioning(e.target.value)}
            />
            <Input
              label="Site web"
              placeholder="https://www.example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              hint="Sera utilisé pour l'extraction automatique de l'ADN de marque"
            />
          </div>
        </Card>

        {/* Tone of Voice */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-500" />
              Ton de voix
            </CardTitle>
            <CardDescription>Définissez le style de communication de la marque.</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label="Style"
              placeholder="ex: Chaleureux et accessible, Luxe et raffiné, Direct et énergique..."
              value={toneStyle}
              onChange={(e) => setToneStyle(e.target.value)}
            />
            <Input
              label="À faire (séparés par des virgules)"
              placeholder="ex: Tutoyer, Utiliser l'humour, Storytelling personnel"
              value={toneDo}
              onChange={(e) => setToneDo(e.target.value)}
            />
            <Input
              label="À éviter (séparés par des virgules)"
              placeholder="ex: Jargon technique, Ton corporate, Emojis excessifs"
              value={toneDont}
              onChange={(e) => setToneDont(e.target.value)}
            />
          </div>
        </Card>

        {/* Technical Prefs */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-500" />
              Préférences techniques
            </CardTitle>
            <CardDescription>Configuration de l&apos;ESP et des options de design.</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Plateforme d&apos;envoi (ESP)
              </label>
              <select
                value={esp}
                onChange={(e) => setEsp(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {ESP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="darkMode"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="darkMode" className="text-sm text-surface-700">
                Support du mode sombre dans les emails
              </label>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Informations complémentaires sur le client.</CardDescription>
          </CardHeader>
          <Textarea
            placeholder="Notes libres (charte graphique, contraintes particulières, historique...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </Card>

        {/* Submit */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
        )}
        <div className="flex gap-4">
          <Button type="submit" isLoading={isSubmitting} size="lg">
            Créer le client
          </Button>
          <Link href="/clients">
            <Button variant="ghost" size="lg">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

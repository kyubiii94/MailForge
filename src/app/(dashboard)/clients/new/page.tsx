'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

const DEFAULT_TONE = { style: '', language: [] as string[], do: [] as string[], dont: [] as string[] };
const DEFAULT_PREFS = { esp: null as 'mailchimp' | 'klaviyo' | 'brevo' | 'other' | null, mergeTagsFormat: '', darkMode: false, languages: [] as string[] };

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [positioning, setPositioning] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom du client est requis.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          sector: sector.trim(),
          positioning: positioning.trim(),
          website: website.trim() || null,
          notes: notes.trim(),
          socialLinks: {},
          distribution: [],
          toneOfVoice: DEFAULT_TONE,
          technicalPrefs: DEFAULT_PREFS,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création du client.');
        return;
      }
      router.push(`/clients/${data.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes('Failed to fetch')
        ? 'Impossible de joindre le serveur. Vérifiez votre connexion et que l\'application tourne.'
        : `Erreur : ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Nouveau client</h1>
        <p className="text-surface-500 mt-1">Ajoutez un client pour associer vos campagnes à une marque.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card variant="elevated" padding="lg">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom du client *" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Maison Dupont" />
            <Input label="Secteur" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex: Mode, Beauté, Tech..." />
          </div>
          <div className="mt-4">
            <Input label="Positionnement" value={positioning} onChange={(e) => setPositioning(e.target.value)} placeholder="Ex: Marque premium de cosmétiques" />
          </div>
          <div className="mt-4">
            <Input label="Site web" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </div>
          <div className="mt-4">
            <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes internes..." />
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex gap-3">
            <Button type="submit" isLoading={loading}>Créer le client</Button>
            <Button type="button" variant="ghost" onClick={() => router.push('/clients')}>Annuler</Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

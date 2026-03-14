'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { StyleBuilder } from '@/components/library/StyleBuilder';
import type { NewsletterInspiration, NewsletterStyle } from '@/types/library';

export default function EditStylePage() {
  const params = useParams();
  const router = useRouter();
  const [style, setStyle] = useState<NewsletterStyle | null>(null);
  const [inspirations, setInspirations] = useState<NewsletterInspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/library/styles').then(r => r.json()),
      fetch('/api/library/inspirations?limit=200').then(r => r.json()),
    ]).then(([styles, insps]) => {
      const stylesList = Array.isArray(styles) ? styles : [];
      const found = stylesList.find((s: NewsletterStyle) => s.id === params.styleId);
      setStyle(found || null);
      setInspirations(Array.isArray(insps) ? insps : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.styleId]);

  const handleSave = async (data: {
    name: string;
    description: string;
    stylePrompt: string;
    coverInspirationId: string | null;
    inspirationIds: string[];
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/library/styles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.styleId, ...data }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStyle(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce style ?')) return;
    setDeleting(true);
    await fetch('/api/library/styles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.styleId }),
    });
    router.push('/library/styles');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!style) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-500">Style introuvable</p>
        <Link href="/library/styles" className="text-brand-600 hover:underline mt-2 inline-block">
          Retour aux styles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/library/styles"
            className="p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{style.name}</h1>
            <p className="text-sm text-surface-500 mt-0.5">Modifier le style</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Supprimer
        </button>
      </div>

      <StyleBuilder
        style={style}
        allInspirations={inspirations}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

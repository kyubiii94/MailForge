'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StyleBuilder } from '@/components/library/StyleBuilder';
import type { NewsletterInspiration } from '@/types/library';

export default function NewStylePage() {
  const router = useRouter();
  const [inspirations, setInspirations] = useState<NewsletterInspiration[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/library/inspirations?limit=200')
      .then(r => r.json())
      .then(setInspirations)
      .catch(() => {});
  }, []);

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const style = await res.json();
        router.push(`/library/styles/${style.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/library/styles"
          className="p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Nouveau style</h1>
          <p className="text-sm text-surface-500 mt-0.5">Définissez un style visuel à partir de vos newsletters</p>
        </div>
      </div>

      <StyleBuilder
        allInspirations={inspirations}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

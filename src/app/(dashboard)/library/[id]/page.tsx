'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, ExternalLink, Calendar, Loader2 } from 'lucide-react';
import { NewsletterPreview } from '@/components/library/NewsletterPreview';
import { TagBadge } from '@/components/library/TagBadge';
import type { NewsletterInspiration } from '@/types/library';
import { formatDate } from '@/lib/utils';

export default function InspirationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inspiration, setInspiration] = useState<NewsletterInspiration | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/library/inspirations?search=&limit=100`)
      .then(r => r.json())
      .then((data: unknown) => {
        const all = Array.isArray(data) ? data : [];
        const found = all.find((i: NewsletterInspiration) => i.id === params.id);
        setInspiration(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    if (!inspiration || !confirm('Supprimer cette newsletter ?')) return;
    setDeleting(true);
    await fetch('/api/library/inspirations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: inspiration.id }),
    });
    router.push('/library');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!inspiration) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-500">Newsletter introuvable</p>
        <Link href="/library" className="text-brand-600 hover:underline mt-2 inline-block">
          Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/library"
            className="p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{inspiration.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
              {inspiration.sourceBrand && (
                <span className="font-medium">{inspiration.sourceBrand}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(inspiration.createdAt)}
              </span>
              {inspiration.sourceUrl && (
                <a
                  href={inspiration.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brand-600 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Source
                </a>
              )}
            </div>
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

      {/* Description */}
      {inspiration.description && (
        <p className="text-sm text-surface-600 bg-surface-50 rounded-lg p-4 border border-surface-200">
          {inspiration.description}
        </p>
      )}

      {/* Tags */}
      {inspiration.tags && inspiration.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {inspiration.tags.map(tag => (
            <TagBadge key={tag.id} tag={tag} size="md" />
          ))}
        </div>
      )}

      {/* Preview */}
      <NewsletterPreview
        fileType={inspiration.fileType}
        filePath={inspiration.filePath}
        htmlContent={inspiration.htmlContent}
        title={inspiration.title}
      />
    </div>
  );
}

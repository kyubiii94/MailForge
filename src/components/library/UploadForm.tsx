'use client';

import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import type { InspirationTag } from '@/types/library';
import { TagBadge } from './TagBadge';

interface FileMetadata {
  title: string;
  description: string;
  sourceUrl: string;
  sourceBrand: string;
  tagIds: string[];
}

interface UploadFormProps {
  files: File[];
  tags: InspirationTag[];
  onSubmit: (metadata: FileMetadata[]) => Promise<void>;
  onCancel: () => void;
  uploading: boolean;
  progress: number;
}

export function UploadForm({ files, tags, onSubmit, onCancel, uploading, progress }: UploadFormProps) {
  const [metadata, setMetadata] = useState<FileMetadata[]>(() =>
    files.map(f => ({
      title: f.name.replace(/\.[^.]+$/, ''),
      description: '',
      sourceUrl: '',
      sourceBrand: '',
      tagIds: [],
    }))
  );

  const [bulkBrand, setBulkBrand] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [allTags, setAllTags] = useState(tags);

  const updateMeta = (index: number, field: keyof FileMetadata, value: string | string[]) => {
    setMetadata(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const applyBulkBrand = () => {
    if (!bulkBrand) return;
    setMetadata(prev => prev.map(m => ({ ...m, sourceBrand: bulkBrand })));
  };

  const toggleTag = (fileIndex: number, tagId: string) => {
    setMetadata(prev => prev.map((m, i) => {
      if (i !== fileIndex) return m;
      const current = m.tagIds;
      return {
        ...m,
        tagIds: current.includes(tagId)
          ? current.filter(id => id !== tagId)
          : [...current, tagId],
      };
    }));
  };

  const createNewTag = async () => {
    if (!newTagName.trim() || creatingTag) return;
    setCreatingTag(true);
    try {
      const res = await fetch('/api/library/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      if (res.ok) {
        const tag = await res.json() as InspirationTag;
        setAllTags(prev => [...prev, tag]);
        setNewTagName('');
      }
    } finally {
      setCreatingTag(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk actions */}
      {files.length > 1 && (
        <div className="p-4 bg-brand-50 rounded-lg border border-brand-200">
          <p className="text-sm font-medium text-brand-800 mb-3">Appliquer à tous les fichiers</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Marque / expéditeur"
              value={bulkBrand}
              onChange={(e) => setBulkBrand(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-brand-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={applyBulkBrand}
              className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}

      {/* Per-file metadata */}
      {files.map((file, i) => (
        <div key={`${file.name}-${i}`} className="p-4 bg-white rounded-lg border border-surface-200 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-surface-100">
            {file.type.startsWith('image/') && (
              <img src={URL.createObjectURL(file)} alt="" className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">{file.name}</p>
              <p className="text-xs text-surface-400">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Titre *</label>
              <input
                type="text"
                value={metadata[i].title}
                onChange={(e) => updateMeta(i, 'title', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Marque / Expéditeur</label>
              <input
                type="text"
                value={metadata[i].sourceBrand}
                onChange={(e) => updateMeta(i, 'sourceBrand', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Description</label>
            <textarea
              value={metadata[i].description}
              onChange={(e) => updateMeta(i, 'description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">URL source</label>
            <input
              type="url"
              value={metadata[i].sourceUrl}
              onChange={(e) => updateMeta(i, 'sourceUrl', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  onClick={() => toggleTag(i, tag.id)}
                  selected={metadata[i].tagIds.includes(tag.id)}
                />
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createNewTag()}
                  placeholder="+ Nouveau tag"
                  className="w-24 px-2 py-0.5 text-xs border border-dashed border-surface-300 rounded-full focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {newTagName && (
                  <button type="button" onClick={createNewTag} disabled={creatingTag} className="text-brand-600">
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Upload progress */}
      {uploading && (
        <div className="p-4 bg-brand-50 rounded-lg border border-brand-200">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
            <span className="text-sm font-medium text-brand-800">Upload en cours... {Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-brand-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="px-5 py-2.5 text-sm font-medium text-surface-600 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => onSubmit(metadata)}
          disabled={uploading || metadata.some(m => !m.title.trim())}
          className="px-5 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {uploading ? 'Upload...' : `Uploader ${files.length} fichier(s)`}
        </button>
      </div>
    </div>
  );
}

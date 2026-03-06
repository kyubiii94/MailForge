'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressSteps } from '@/components/ui/progress-steps';
import type { Visual } from '@/types';
import { formatFileSize } from '@/lib/utils';
import {
  Image as ImageIcon,
  Upload,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const steps = [
  { id: 'text', label: 'Contenu Textuel' },
  { id: 'visuals', label: 'Visuels' },
  { id: 'design', label: 'Design Email' },
];

export default function CampaignVisualsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVisuals();
  }, [campaignId]);

  const fetchVisuals = async () => {
    try {
      const res = await fetch(`/api/visuals/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setVisuals(data);
      }
    } catch {
      // Silently fail
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('campaignId', campaignId);
      acceptedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/visuals/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const uploaded = await res.json();
      setVisuals((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [campaignId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const toggleSelection = (id: string) => {
    setVisuals((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isSelected: !v.isSelected } : v))
    );
  };

  const removeVisual = (id: string) => {
    setVisuals((prev) => prev.filter((v) => v.id !== id));
  };

  const selectedCount = visuals.filter((v) => v.isSelected).length;

  return (
    <div className="space-y-8">
      {/* Progress */}
      <ProgressSteps
        steps={steps}
        currentStep="visuals"
        completedSteps={['text']}
        onStepClick={(stepId) => {
          router.push(`/campaigns/${campaignId}/${stepId}`);
        }}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
          <ImageIcon className="w-7 h-7 text-brand-600" />
          Contenu Visuel
        </h1>
        <p className="text-surface-500 mt-1">
          Uploadez les visuels pour votre email marketing.
        </p>
      </div>

      {/* Upload zone */}
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle>Upload de visuels</CardTitle>
          <CardDescription>
            Glissez-déposez vos images ou cliquez pour sélectionner. Formats acceptés : JPG, PNG, WebP, GIF (max 10 Mo).
          </CardDescription>
        </CardHeader>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-brand-500 bg-brand-50'
              : 'border-surface-300 hover:border-brand-400 hover:bg-surface-50'
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
              <p className="text-sm text-surface-600">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-10 h-10 text-surface-400" />
              <div>
                <p className="text-sm font-medium text-surface-700">
                  {isDragActive ? 'Déposez les fichiers ici' : 'Glissez vos images ici'}
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  ou cliquez pour parcourir
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
        )}
      </Card>

      {/* Visual gallery */}
      {visuals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-900">
              Bibliothèque ({visuals.length} visuels)
            </h2>
            <Badge variant="info">{selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visuals.map((visual) => (
              <div
                key={visual.id}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  visual.isSelected
                    ? 'border-brand-500 ring-2 ring-brand-200'
                    : 'border-surface-200 hover:border-surface-300'
                }`}
                onClick={() => toggleSelection(visual.id)}
              >
                <div className="aspect-square bg-surface-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={visual.fileUrl}
                    alt={visual.altText}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Selection indicator */}
                {visual.isSelected && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVisual(visual.id);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>

                {/* Info */}
                <div className="p-2 bg-white">
                  <p className="text-xs text-surface-700 truncate">{visual.originalFilename}</p>
                  <p className="text-xs text-surface-400">{formatFileSize(visual.fileSize)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/campaigns/${campaignId}/text`)}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour : Texte
        </Button>
        <Button
          size="lg"
          onClick={() => router.push(`/campaigns/${campaignId}/design`)}
        >
          Étape suivante : Design
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

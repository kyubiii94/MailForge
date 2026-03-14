'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { UploadZone } from '@/components/library/UploadZone';
import { UploadForm } from '@/components/library/UploadForm';
import type { InspirationTag } from '@/types/library';

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<InspirationTag[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetch('/api/library/tags')
      .then(r => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => setTags([]));
  }, []);

  const handleSubmit = async (metadata: Array<{
    title: string;
    description: string;
    sourceUrl: string;
    sourceBrand: string;
    tagIds: string[];
  }>) => {
    setUploading(true);
    setProgress(0);

    const total = files.length;
    let completed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const meta = metadata[i] ?? {
        title: file?.name?.replace(/\.[^.]+$/, '') ?? 'Sans titre',
        description: '',
        sourceUrl: '',
        sourceBrand: '',
        tagIds: [],
      };

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', meta.title);
      if (meta.description) formData.append('description', meta.description);
      if (meta.sourceUrl) formData.append('sourceUrl', meta.sourceUrl);
      if (meta.sourceBrand) formData.append('sourceBrand', meta.sourceBrand);
      if (meta.tagIds?.length > 0) formData.append('tagIds', JSON.stringify(meta.tagIds));

      try {
        await fetch('/api/library/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
      }

      completed++;
      setProgress((completed / total) * 100);
    }

    setUploading(false);
    router.push('/library');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/library"
          className="p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Uploader des newsletters</h1>
          <p className="text-sm text-surface-500 mt-0.5">Ajoutez des newsletters à votre bibliothèque d&apos;inspiration</p>
        </div>
      </div>

      {/* Upload zone or form */}
      {files.length === 0 ? (
        <UploadZone files={files} onFilesChange={setFiles} />
      ) : (
        <>
          {!uploading && (
            <UploadZone files={files} onFilesChange={setFiles} />
          )}
          <UploadForm
            files={files}
            tags={tags}
            onSubmit={handleSubmit}
            onCancel={() => setFiles([])}
            uploading={uploading}
            progress={progress}
          />
        </>
      )}
    </div>
  );
}

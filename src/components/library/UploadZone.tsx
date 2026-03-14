'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, FileCode, X } from 'lucide-react';

interface UploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const ACCEPT = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'text/html': ['.html', '.htm'],
};

export function UploadZone({ files, onFilesChange }: UploadZoneProps) {
  const onDrop = useCallback((accepted: File[]) => {
    onFilesChange([...files, ...accepted]);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-brand-500 bg-brand-50'
            : 'border-surface-300 hover:border-brand-400 hover:bg-surface-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
            isDragActive ? 'bg-brand-100' : 'bg-surface-100'
          }`}>
            <Upload className={`w-7 h-7 ${isDragActive ? 'text-brand-600' : 'text-surface-400'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-700">
              {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos newsletters'}
            </p>
            <p className="text-xs text-surface-400 mt-1">PNG, JPG, WebP ou HTML — 10 MB max par fichier</p>
          </div>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
          >
            Parcourir les fichiers
          </button>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-surface-700">{files.length} fichier(s) sélectionné(s)</p>
          {files.map((file, i) => (
            <div key={`${file?.name ?? i}-${i}`} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-200">
              {file?.type?.startsWith('image/') ? (
                <FileImage className="w-5 h-5 text-blue-500 shrink-0" />
              ) : (
                <FileCode className="w-5 h-5 text-orange-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{file?.name ?? 'Fichier'}</p>
                <p className="text-xs text-surface-400">{file?.size != null ? `${(file.size / 1024).toFixed(0)} KB` : '—'}</p>
              </div>
              {file?.type?.startsWith('image/') && (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name ?? ''}
                  className="w-10 h-10 rounded object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="p-1 text-surface-400 hover:text-red-500 transition-colors"
                aria-label="Retirer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

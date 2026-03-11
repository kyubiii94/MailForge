'use client';

import { useState } from 'react';
import { Code, Eye, Copy, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface NewsletterPreviewProps {
  fileType: 'image' | 'html';
  filePath: string;
  htmlContent?: string | null;
  title: string;
}

export function NewsletterPreview({ fileType, filePath, htmlContent, title }: NewsletterPreviewProps) {
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  const copyHtml = async () => {
    if (!htmlContent) return;
    await navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (fileType === 'image') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-1.5 text-surface-500 hover:bg-surface-100 rounded-lg"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-surface-500 font-medium">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
            className="p-1.5 text-surface-500 hover:bg-surface-100 rounded-lg"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-auto border border-surface-200 rounded-xl bg-surface-50 max-h-[80vh]">
          <img
            src={filePath}
            alt={title}
            className="mx-auto transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          />
        </div>
      </div>
    );
  }

  // HTML preview
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSource(false)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            !showSource ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => setShowSource(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            showSource ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-100'
          }`}
        >
          <Code className="w-4 h-4" />
          Source
        </button>
        {htmlContent && (
          <button
            type="button"
            onClick={copyHtml}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-lg transition-colors ml-auto"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier HTML'}
          </button>
        )}
      </div>

      {showSource ? (
        <div className="overflow-auto max-h-[80vh] border border-surface-200 rounded-xl bg-surface-900 p-4">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
            {htmlContent || 'Contenu HTML non disponible'}
          </pre>
        </div>
      ) : (
        <div className="border border-surface-200 rounded-xl overflow-hidden bg-white">
          <iframe
            srcDoc={htmlContent || ''}
            sandbox="allow-same-origin"
            title={`Preview: ${title}`}
            className="w-full min-h-[600px] border-0"
            style={{ height: '80vh' }}
          />
        </div>
      )}
    </div>
  );
}

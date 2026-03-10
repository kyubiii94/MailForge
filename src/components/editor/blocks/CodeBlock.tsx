'use client';

import type { Block } from '@/types/editor';
import { Code } from 'lucide-react';

interface Props {
  block: Block;
  onContentChange?: (content: string) => void;
}

export function CodeBlock({ block, onContentChange }: Props) {
  const p = block.properties;

  return (
    <div className="relative">
      <div className="absolute top-1 right-1 flex items-center gap-1 bg-surface-800 text-white text-[10px] px-1.5 py-0.5 rounded">
        <Code className="w-3 h-3" /> HTML
      </div>
      <pre
        className="bg-surface-900 text-green-400 text-xs p-4 rounded-lg overflow-auto max-h-[200px] outline-none focus:ring-2 focus:ring-brand-400"
        contentEditable={!!onContentChange}
        suppressContentEditableWarning
        onBlur={(e) => onContentChange?.(e.currentTarget.textContent || '')}
      >
        {p.rawHtml || '<!-- HTML custom -->'}
      </pre>
    </div>
  );
}

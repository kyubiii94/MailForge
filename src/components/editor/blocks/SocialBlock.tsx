'use client';

import type { Block } from '@/types/editor';
import { Globe } from 'lucide-react';

interface Props {
  block: Block;
}

export function SocialBlock({ block }: Props) {
  const p = block.properties;
  const links = p.socialLinks || [];

  return (
    <div style={{ textAlign: p.textAlign || 'center', padding: p.padding || '10px 0' }}>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {links.length > 0
          ? links.map((link, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-sm text-surface-600 hover:text-brand-600 px-2 py-1 rounded bg-surface-100"
              >
                <Globe className="w-3.5 h-3.5" />
                {link.platform}
              </span>
            ))
          : <span className="text-sm text-surface-400">Icônes réseaux sociaux</span>
        }
      </div>
    </div>
  );
}

'use client';

import { X } from 'lucide-react';
import type { InspirationTag } from '@/types/library';

interface TagBadgeProps {
  tag: InspirationTag;
  onRemove?: () => void;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
}

export function TagBadge({ tag, onRemove, onClick, selected, size = 'sm' }: TagBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-colors ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      } ${selected ? 'ring-2 ring-offset-1' : ''}`}
      style={{
        backgroundColor: tag.color + '20',
        color: tag.color,
        borderColor: tag.color,
        ['--tw-ring-color' as string]: selected ? tag.color : undefined,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-60 transition-opacity"
          aria-label={`Retirer le tag ${tag.name}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

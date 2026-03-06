'use client';

import { cn } from '@/lib/utils';

interface ColorSwatchProps {
  color: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  onChange?: (color: string) => void;
  className?: string;
}

export function ColorSwatch({
  color,
  label,
  size = 'md',
  editable = false,
  onChange,
  className,
}: ColorSwatchProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-lg border-2 border-surface-200 shadow-sm',
            sizes[size]
          )}
          style={{ backgroundColor: color }}
        />
        {editable && (
          <input
            type="color"
            value={color}
            onChange={(e) => onChange?.(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        )}
      </div>
      {label && <span className="text-xs text-surface-500">{label}</span>}
      <span className="text-xs font-mono text-surface-400">{color}</span>
    </div>
  );
}

'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: boolean;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, charCount, maxChars, id, value, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-surface-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors duration-200 resize-y min-h-[100px]',
            'bg-white text-surface-900 placeholder:text-surface-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error
              ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
              : 'border-surface-300 hover:border-surface-400',
            className
          )}
          {...props}
        />
        <div className="flex justify-between mt-1">
          <div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {hint && !error && <p className="text-sm text-surface-500">{hint}</p>}
          </div>
          {charCount && (
            <p className={cn('text-xs', maxChars && currentLength > maxChars ? 'text-red-500' : 'text-surface-400')}>
              {currentLength}{maxChars ? `/${maxChars}` : ''}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-surface-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg border text-sm transition-colors duration-200',
            'bg-white text-surface-900 placeholder:text-surface-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error
              ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
              : 'border-surface-300 hover:border-surface-400',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-surface-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

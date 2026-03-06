'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

export function ProgressSteps({ steps, currentStep, completedSteps, onStepClick }: ProgressStepsProps) {
  return (
    <nav className="flex items-center justify-center" aria-label="Progress">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || isCurrent;

          return (
            <li key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  isCurrent && 'bg-brand-50 text-brand-700 ring-2 ring-brand-200',
                  isCompleted && !isCurrent && 'text-green-700 hover:bg-green-50',
                  !isCompleted && !isCurrent && 'text-surface-400 cursor-not-allowed'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                    isCurrent && 'bg-brand-600 text-white',
                    isCompleted && !isCurrent && 'bg-green-500 text-white',
                    !isCompleted && !isCurrent && 'bg-surface-200 text-surface-500'
                  )}
                >
                  {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn('w-8 h-0.5 mx-1', isCompleted ? 'bg-green-400' : 'bg-surface-200')} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

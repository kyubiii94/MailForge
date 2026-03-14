'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold text-surface-900">Une erreur s&apos;est produite</h1>
        <p className="text-sm text-surface-600">
          {error.message || 'Une exception côté client a eu lieu. Consultez la console du navigateur pour plus de détails.'}
        </p>
        <Button onClick={reset} variant="outline">
          Réessayer
        </Button>
      </div>
    </div>
  );
}

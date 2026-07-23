'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogoutButtonProps {
  email?: string | null;
  name?: string | null;
}

export function LogoutButton({ email, name }: LogoutButtonProps) {
  return (
    <div className="space-y-2">
      {(name || email) && (
        <div className="px-3">
          <p className="text-sm font-medium text-surface-800 truncate">
            {name || 'Utilisateur'}
          </p>
          {email && (
            <p className="text-xs text-surface-400 truncate">{email}</p>
          )}
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-start text-surface-600"
        onClick={() => signOut({ callbackUrl: '/login' })}
        aria-label="Se déconnecter"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </Button>
    </div>
  );
}

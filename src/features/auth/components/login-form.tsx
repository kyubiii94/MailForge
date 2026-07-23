'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginSchema, setupSchema } from '@/features/auth/schemas/login';

type FieldErrors = Partial<Record<'email' | 'password' | 'name', string>>;

interface LoginFormProps {
  needsSetup: boolean;
  callbackUrl?: string;
}

export function LoginForm({ needsSetup, callbackUrl = '/campaigns' }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'setup'>(needsSetup ? 'setup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function switchToLogin() {
    setMode('login');
    setFormError(null);
    setFieldErrors({});
    setStatus('idle');
  }

  function switchToSetup() {
    if (!needsSetup) return;
    setMode('setup');
    setFormError(null);
    setFieldErrors({});
    setStatus('idle');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setStatus('loading');

    if (mode === 'setup') {
      const parsed = setupSchema.safeParse({ name, email, password });
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        setFieldErrors({
          name: flat.name?.[0],
          email: flat.email?.[0],
          password: flat.password?.[0],
        });
        setStatus('error');
        return;
      }

      try {
        const res = await fetch('/api/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        });
        const data = (await res.json()) as { error?: string };

        if (!res.ok) {
          const alreadyExists =
            res.status === 403 ||
            (data.error ?? '').toLowerCase().includes('existe déjà');

          if (alreadyExists) {
            setMode('login');
            setFormError(
              'Un compte admin existe déjà. Connectez-vous avec votre email et mot de passe.'
            );
            setStatus('error');
            return;
          }

          setFormError(data.error ?? 'Impossible de créer le compte');
          setStatus('error');
          return;
        }

        const result = await signIn('credentials', {
          email: parsed.data.email,
          password: parsed.data.password,
          redirect: false,
        });

        if (result?.error) {
          setFormError('Compte créé, mais la connexion a échoué. Réessayez.');
          setMode('login');
          setStatus('error');
          return;
        }

        setStatus('success');
        router.push(callbackUrl);
        router.refresh();
      } catch {
        setFormError('Erreur réseau. Réessayez.');
        setStatus('error');
      }
      return;
    }

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: flat.email?.[0],
        password: flat.password?.[0],
      });
      setStatus('error');
      return;
    }

    try {
      const result = await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (result?.error) {
        setFormError('Identifiants incorrects');
        setStatus('error');
        return;
      }

      setStatus('success');
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError('Erreur réseau. Réessayez.');
      setStatus('error');
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>
          {mode === 'setup' ? 'Configuration initiale' : 'Connexion'}
        </CardTitle>
        <CardDescription>
          {mode === 'setup'
            ? 'Créez le premier compte administrateur pour sécuriser MailForge.'
            : 'Connectez-vous avec votre compte administrateur.'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'setup' && (
          <div
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800"
            role="status"
          >
            Premier démarrage : créez le compte administrateur.
          </div>
        )}

        {mode === 'setup' && (
          <Input
            id="auth-name"
            label="Nom"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            aria-invalid={!!fieldErrors.name}
            disabled={status === 'loading'}
          />
        )}

        <Input
          id="auth-email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          aria-invalid={!!fieldErrors.email}
          disabled={status === 'loading'}
        />

        <Input
          id="auth-password"
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          aria-invalid={!!fieldErrors.password}
          hint={mode === 'setup' ? 'Minimum 8 caractères' : undefined}
          disabled={status === 'loading'}
        />

        {formError && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={status === 'loading'}
        >
          {mode === 'setup' ? 'Créer le compte' : 'Se connecter'}
        </Button>

        <p className="text-center text-sm text-surface-500">
          {mode === 'setup' ? (
            <button
              type="button"
              onClick={switchToLogin}
              className="font-medium text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            >
              J’ai déjà un compte — se connecter
            </button>
          ) : needsSetup ? (
            <button
              type="button"
              onClick={switchToSetup}
              className="font-medium text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            >
              Créer le compte administrateur
            </button>
          ) : null}
        </p>
      </form>
    </>
  );
}

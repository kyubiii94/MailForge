import { Zap } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/components/login-form';
import { countUsers } from '@/features/auth/service';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: { callbackUrl?: string };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  let needsSetup = false;
  try {
    needsSetup = (await countUsers()) === 0;
  } catch {
    needsSetup = true;
  }

  const callbackUrl =
    typeof searchParams.callbackUrl === 'string' &&
    searchParams.callbackUrl.startsWith('/')
      ? searchParams.callbackUrl
      : '/campaigns';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-brand">
            <Zap className="h-6 w-6 text-white" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">MailForge</h1>
          <p className="mt-1 text-sm text-surface-500">Accès sécurisé à la plateforme</p>
        </div>

        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>
              {needsSetup ? 'Configuration initiale' : 'Connexion'}
            </CardTitle>
            <CardDescription>
              {needsSetup
                ? 'Créez le premier compte administrateur pour sécuriser MailForge.'
                : 'Connectez-vous pour accéder aux campagnes et à la bibliothèque.'}
            </CardDescription>
          </CardHeader>
          <LoginForm needsSetup={needsSetup} callbackUrl={callbackUrl} />
        </Card>
      </div>
    </div>
  );
}

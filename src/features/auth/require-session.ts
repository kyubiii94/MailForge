import { auth } from '@/auth';

/**
 * Vérifie la session côté serveur (défense en profondeur pour les API).
 * Retourne null si non authentifié.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

import type { NextAuthConfig } from 'next-auth';

/**
 * Config Edge-compatible (pas de bcrypt / Neon ici).
 * Utilisée par le middleware.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8, // 8 heures
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role?: string }).role ?? 'admin';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as 'admin' | 'editor') ?? 'admin';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

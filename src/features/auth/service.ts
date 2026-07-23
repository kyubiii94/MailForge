import { eq, sql } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { getDb, schema } from '@/lib/db/index';
import type { LoginInput, SetupInput } from './schemas/login';

const SALT_ROUNDS = 12;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
};

function mapUser(row: typeof schema.users.$inferSelect): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === 'editor' ? 'editor' : 'admin',
  };
}

export async function countUsers(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.users);
  return row?.count ?? 0;
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  return user ?? null;
}

export async function verifyCredentials(
  input: LoginInput
): Promise<AuthUser | null> {
  const user = await findUserByEmail(input.email);
  if (!user) return null;

  const valid = await compare(input.password, user.passwordHash);
  if (!valid) return null;

  return mapUser(user);
}

export async function createFirstAdmin(
  input: SetupInput
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const existing = await countUsers();
  if (existing > 0) {
    return { ok: false, error: 'Un compte admin existe déjà' };
  }

  const passwordHash = await hash(input.password, SALT_ROUNDS);
  const db = getDb();
  const [created] = await db
    .insert(schema.users)
    .values({
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      role: 'admin',
    })
    .returning();

  if (!created) {
    return { ok: false, error: 'Impossible de créer le compte' };
  }

  return { ok: true, user: mapUser(created) };
}

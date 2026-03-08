/**
 * Seed script: ensures the default workspace exists in the database.
 * Run with: npx tsx src/lib/seed.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { workspaces } from './schema';
import { eq } from 'drizzle-orm';

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Check if default workspace already exists
  const existing = await db.select().from(workspaces).where(eq(workspaces.id, DEFAULT_WORKSPACE_ID));

  if (existing.length === 0) {
    await db.insert(workspaces).values({
      id: DEFAULT_WORKSPACE_ID,
      name: 'Mon Workspace',
      ownerId: 'default-user',
      plan: 'free',
    });
    console.log('Default workspace created.');
  } else {
    console.log('Default workspace already exists.');
  }
}

seed().catch(console.error);

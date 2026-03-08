import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | null = null;

/** Lazy-initialized Drizzle instance (avoids crashing at build time when DATABASE_URL is absent). */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is required. Set it to your Neon PostgreSQL connection string.');
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

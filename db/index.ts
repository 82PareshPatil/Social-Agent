import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Set DATABASE_URL in .env.local or .env for PostgreSQL access');
}

const globalForDb = globalThis as unknown as { postgresClient?: ReturnType<typeof postgres> };
const client = globalForDb.postgresClient ?? postgres(connectionString, {
  max: 5,
  prepare: false,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== 'production') globalForDb.postgresClient = client;

// Direct PostgreSQL access is privileged. Use only in trusted server code,
// with explicit authorization and user filters; use the SDK for user-scoped RLS.
export const db = drizzle(client, { schema });

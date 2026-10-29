import { loadEnvConfig } from '@next/env';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

const client = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
async function main() {
 try {
  const db = drizzle(client);
  await db.execute(sql`select 1 as connection_ok`);
  console.log('PostgreSQL connection verified through Drizzle.');
 } catch (error) {
  // Avoid logging connection strings or driver errors containing credentials.
  const code = error && typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN';
  console.error(`PostgreSQL connection failed (${code}). Check DATABASE_URL and database availability.`);
  process.exitCode = 1;
 } finally {
  await client.end();
 }
}

void main();

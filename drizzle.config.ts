import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/generated',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
  schemaFilter: ['public'],
  strict: true,
});

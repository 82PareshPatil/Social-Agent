import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';

nextEnv.loadEnvConfig(process.cwd());

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
if (!baseUrl || !anonKey) {
  throw new Error('Missing InsForge environment variables in .env.local');
}

const insforge = createClient({ baseUrl, anonKey });
const { error } = await insforge.auth.getPublicAuthConfig();
if (error) {
  console.error('InsForge connection failed:', error.message);
  process.exitCode = 1;
} else {
  console.log(`InsForge SDK connection verified: ${baseUrl}`);
}

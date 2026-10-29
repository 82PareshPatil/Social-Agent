import nextEnv from '@next/env';
import { createClient } from '@insforge/sdk';

nextEnv.loadEnvConfig(process.cwd());
const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
});

// A fresh client has no signed-in session. Both operations must be forbidden.
for (const [name, operation] of [
  ['anonymous profile read', () => client.database.from('users').select('id').limit(1)],
  ['anonymous profile initialization', () => client.database.rpc('ensure_user_profile')],
]) {
  const result = await operation();
  if (!result.error || ![401, 403].includes(result.status)) {
    throw new Error(`${name}: expected access denial, received status ${result.status}`);
  }
  console.log(`${name}: denied as expected`);
}

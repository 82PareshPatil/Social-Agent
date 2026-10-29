import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@insforge/sdk/ssr';

export async function getInsForgeServer() {
  return createServerClient({ cookies: await cookies() });
}

export function appOrigin() {
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin) throw new Error('NEXT_PUBLIC_APP_URL must be configured');
  return new URL(origin).origin;
}

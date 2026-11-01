import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { appOrigin, getInsForgeServer } from '@/lib/insforge-server';
import { authorizeUrl, instagramConfigured } from '@/lib/instagram';

export async function GET() {
  const client = await getInsForgeServer();
  const { data } = await client.auth.getCurrentUser();
  if (!data?.user) return NextResponse.redirect(new URL('/sign-in', appOrigin()));
  if (!instagramConfigured()) return NextResponse.redirect(new URL('/dashboard/accounts?error=not_configured', appOrigin()));

  const state = randomBytes(24).toString('base64url');
  (await cookies()).set('instagram_oauth_state', state, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600,
  });
  return NextResponse.redirect(authorizeUrl(state));
}

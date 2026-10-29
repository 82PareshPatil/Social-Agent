import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createAuthActions, createServerClient } from '@insforge/sdk/ssr';
import { appOrigin } from '@/lib/insforge-server';

export async function GET(request: NextRequest) {
  const store = await cookies();
  const verifier = store.get('insforge_code_verifier')?.value;
  const code = request.nextUrl.searchParams.get('insforge_code');
  store.delete('insforge_code_verifier');
  if (!code || !verifier || request.nextUrl.searchParams.has('error')) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth', appOrigin()));
  }
  try {
    const auth = createAuthActions({ cookies: store });
    const { data, error } = await auth.exchangeOAuthCode(code, verifier);
    if (error || !data?.user) return NextResponse.redirect(new URL('/sign-in?error=oauth', appOrigin()));
    const client = createServerClient({ cookies: store });
    const { error: profileError } = await client.database.rpc('ensure_user_profile');
    if (profileError) return NextResponse.redirect(new URL('/sign-in?error=profile', appOrigin()));
  } catch {
    return NextResponse.redirect(new URL('/sign-in?error=oauth', appOrigin()));
  }
  return NextResponse.redirect(new URL('/dashboard', appOrigin()));
}

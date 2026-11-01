import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { encryptSecret } from '@/lib/crypto';
import { appOrigin, getInsForgeServer } from '@/lib/insforge-server';
import { exchangeCode, fetchProfile, INSTAGRAM_SCOPES, toLongLived } from '@/lib/instagram';

const back = (error?: string) => NextResponse.redirect(new URL(`/dashboard/accounts${error ? `?error=${error}` : '?connected=1'}`, appOrigin()));

function sameState(a?: string, b?: string | null) {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const store = await cookies();
  const expected = store.get('instagram_oauth_state')?.value;
  store.delete('instagram_oauth_state');

  const params = request.nextUrl.searchParams;
  if (params.has('error')) return back('denied');
  const code = params.get('code')?.replace(/#_$/, '');
  if (!code || !sameState(expected, params.get('state'))) return back('state');

  const client = await getInsForgeServer();
  const { data: session } = await client.auth.getCurrentUser();
  if (!session?.user) return NextResponse.redirect(new URL('/sign-in', appOrigin()));

  try {
    const short = await exchangeCode(code);
    const long = await toLongLived(short.token);
    const profile = await fetchProfile(long.token);
    const { error } = await client.database.rpc('save_social_connection', {
      p_provider: 'instagram', p_account_id: profile.id || short.userId, p_username: profile.username ?? null,
      p_account_type: profile.accountType ?? null, p_token_enc: encryptSecret(long.token),
      p_expires_at: long.expiresAt.toISOString(), p_scopes: INSTAGRAM_SCOPES,
    });
    if (error) return back('save');
  } catch {
    return back('exchange');
  }
  return back();
}

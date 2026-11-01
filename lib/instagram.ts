import 'server-only';
import { appOrigin } from './insforge-server';

// Instagram API with Instagram Login (Business Login). Tokens never leave the server.
export const INSTAGRAM_SCOPES = ['instagram_business_basic', 'instagram_business_content_publish'];

// META_APP_* are accepted as a fallback; Instagram Login expects the *Instagram* app id/secret
// (Meta dashboard -> Instagram use case -> API setup with Instagram login).
const appId = () => (process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID)?.trim();
const appSecret = () => (process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET)?.trim();

function credentials() {
  const id = appId();
  const secret = appSecret();
  if (!id || !secret) throw new Error('INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET must be configured');
  return { id, secret };
}

export const instagramConfigured = () => !!appId() && !!appSecret();
export const redirectUri = () => `${appOrigin()}/api/meta/callback`;

export function authorizeUrl(state: string) {
  const url = new URL('https://www.instagram.com/oauth/authorize');
  url.search = new URLSearchParams({
    client_id: credentials().id, redirect_uri: redirectUri(), response_type: 'code',
    scope: INSTAGRAM_SCOPES.join(','), state,
  }).toString();
  return url.toString();
}

async function json(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error || body.error_message) throw new Error('Instagram request failed');
  return body;
}

/** Authorization code (single use, 1 hour) -> short-lived token + Instagram-scoped user id. */
export async function exchangeCode(code: string) {
  const { id, secret } = credentials();
  const body = await json(await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'authorization_code', redirect_uri: redirectUri(), code }),
  }));
  const item = Array.isArray(body.data) ? body.data[0] : body;
  if (!item?.access_token || !item?.user_id) throw new Error('Instagram returned no token');
  return { token: String(item.access_token), userId: String(item.user_id) };
}

/** Short-lived token -> long-lived token (about 60 days). */
export async function toLongLived(token: string) {
  const body = await json(await fetch('https://graph.instagram.com/access_token?' + new URLSearchParams({
    grant_type: 'ig_exchange_token', client_secret: credentials().secret, access_token: token,
  })));
  return { token: String(body.access_token), expiresAt: new Date(Date.now() + Number(body.expires_in) * 1000) };
}

/** Extends a long-lived token by another 60 days (must be at least 24 hours old and not expired). */
export async function refreshLongLived(token: string) {
  const body = await json(await fetch('https://graph.instagram.com/refresh_access_token?' + new URLSearchParams({
    grant_type: 'ig_refresh_token', access_token: token,
  })));
  return { token: String(body.access_token), expiresAt: new Date(Date.now() + Number(body.expires_in) * 1000) };
}

export async function fetchProfile(token: string) {
  const body = await json(await fetch('https://graph.instagram.com/me?' + new URLSearchParams({
    fields: 'user_id,username,account_type', access_token: token,
  })));
  return { id: String(body.user_id ?? body.id), username: body.username as string | undefined, accountType: body.account_type as string | undefined };
}

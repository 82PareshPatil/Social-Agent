'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAuthActions } from '@insforge/sdk/ssr';
import { appOrigin, getInsForgeServer } from './insforge-server';

export type AuthState = {
  error?: string;
  message?: string;
  email?: string;
  verification?: 'code' | 'link';
};

async function saveProfile() {
  const client = await getInsForgeServer();
  const { error } = await client.database.rpc('ensure_user_profile');
  if (error) throw new Error('You are signed in, but your profile could not be saved. Please try again.');
}

export async function authenticate(_previous: AuthState, form: FormData): Promise<AuthState> {
  const intent = String(form.get('intent') ?? 'sign-in');
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const auth = createAuthActions({ cookies: await cookies() });

  try {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: 'Enter a valid email address.' };
    }
    if (intent === 'resend') {
      const client = await getInsForgeServer();
      const { data: config } = await client.auth.getPublicAuthConfig();
      const { error } = await client.auth.resendVerificationEmail({ email, redirectTo: `${appOrigin()}/sign-in?verified=1` });
      return { email, verification: config?.verifyEmailMethod ?? 'code',
        error: error ? 'Could not send another verification email. Please wait a minute and try again.' : undefined,
        message: error ? undefined : 'If verification is pending, a new email is on its way.' };
    } else if (intent === 'verify') {
      const otp = String(form.get('otp') ?? '').trim();
      if (!/^\d{6}$/.test(otp)) return { error: 'Enter the 6-digit code from your email.', email, verification: 'code' };
      const { data, error } = await auth.verifyEmail({ email, otp });
      if (error || !data?.user) return { error: error?.message ?? 'Could not verify your email.', email, verification: 'code' };
    } else if (intent === 'sign-up') {
      const name = String(form.get('name') ?? '').trim();
      if (!name || name.length > 100) return { error: 'Enter your name (up to 100 characters).' };
      const configClient = await getInsForgeServer();
      const { data: config, error: configError } = await configClient.auth.getPublicAuthConfig();
      if (configError || !config) return { error: 'Authentication is temporarily unavailable. Try again.' };
      if (password.length < config.passwordMinLength) return { error: `Use at least ${config.passwordMinLength} characters for your password.` };
      const { data, error } = await auth.signUp({ email, password, name, redirectTo: `${appOrigin()}/sign-in?verified=1` });
      if (error || !data) return { error: error?.message ?? 'Could not create your account.' };
      if (data.requireEmailVerification) {
        return { email, verification: config.verifyEmailMethod, message: config.verifyEmailMethod === 'code'
          ? 'We sent a 6-digit verification code to your email.' : 'Check your email and follow the verification link, then sign in.' };
      }
      if (!data.user) return { error: 'Account created. Please sign in.' };
    } else if (intent === 'sign-in') {
      if (!password) return { error: 'Enter your password.' };
      const { data, error } = await auth.signInWithPassword({ email, password });
      if (error || !data?.user) {
        return { error: error?.statusCode === 403 ? 'Verify your email before signing in. Open Sign up to enter your verification code.'
          : 'Could not sign in. Check your email and password.' };
      }
    } else {
      return { error: 'Unsupported authentication request.' };
    }
    await saveProfile();
  } catch {
    return { error: 'Could not complete sign-in or save your profile. Please try again.' };
  }
  redirect('/dashboard');
}

export async function googleSignIn(_previous: AuthState, _form: FormData): Promise<AuthState> {
  let destination: string;
  try {
    const store = await cookies();
    const auth = createAuthActions({ cookies: store });
    const { data, error } = await auth.signInWithOAuth('google', {
      redirectTo: `${appOrigin()}/api/auth/callback`, skipBrowserRedirect: true,
    });
    if (error || !data?.url || !data.codeVerifier) return { error: 'Google sign-in is unavailable. Please try again.' };
    store.set('insforge_code_verifier', data.codeVerifier, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600,
    });
    destination = data.url;
  } catch {
    return { error: 'Could not start Google sign-in. Please try again.' };
  }
  redirect(destination);
}

export async function signOut() {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
  redirect('/sign-in');
}

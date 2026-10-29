import type { Metadata } from 'next';
import { AuthPage } from '@/components/auth-page';

export const metadata: Metadata = { title: 'Sign in · Social Agent' };

export default async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const message = params.error === 'profile' ? 'Your sign-in succeeded, but your profile could not be saved. Please try again.'
    : params.error ? 'Google sign-in could not be completed. Please try again.'
    : params.verified ? 'If your email verification is complete, sign in below.' : undefined;
  return <AuthPage mode="sign-in" message={message} />;
}

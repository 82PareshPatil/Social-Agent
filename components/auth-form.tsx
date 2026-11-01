'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { authenticate, googleSignIn, type AuthState } from '@/lib/auth-actions';
import styles from './auth.module.css';

export function AuthForm({ mode, googleEnabled, minLength, initialMessage }: {
  mode: 'sign-in' | 'sign-up'; googleEnabled: boolean; minLength: number; initialMessage?: string;
}) {
  const [state, action, pending] = useActionState(authenticate, {} as AuthState);
  const [googleState, googleAction, googlePending] = useActionState(googleSignIn, {} as AuthState);
  const [enterCode, setEnterCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const verification = state.verification ?? (enterCode ? 'code' : undefined);
  const signingUp = mode === 'sign-up';
  const busy = pending || googlePending;

  return <div className={styles.card}>
    <span className={styles.eyebrow}>YOUR CREATIVE WORKSPACE</span>
    <h1>{verification ? 'Check your inbox' : signingUp ? 'Create your account' : 'Welcome back'}</h1>
    <p className={styles.subtitle}>{verification ? 'Verify your email to get started.' : signingUp
      ? 'Bring your next big idea to life with Social Agent.' : 'Sign in to continue to Social Agent.'}</p>

    {initialMessage && !state.error && <p className={styles.notice} role="status">{initialMessage}</p>}
    {(state.error || googleState.error) && <p className={styles.error} role="alert">{state.error || googleState.error}</p>}
    {state.message && <p className={styles.notice} role="status">{state.message}</p>}

    {!verification && googleEnabled && <>
      <form action={googleAction}>
        <button className={styles.google} disabled={busy}>
          <span className={styles.googleIcon} aria-hidden="true">G</span>
          {googlePending ? 'Connecting…' : 'Continue with Google'}
        </button>
      </form>
      <div className={styles.divider}><span>or continue with email</span></div>
    </>}

    {verification !== 'link' && <form action={action} className={styles.form}>
      <input type="hidden" name="intent" value={verification ? 'verify' : mode} />
      {signingUp && !verification && <label>Full name
        <input name="name" autoComplete="name" placeholder="Your name" required maxLength={100} disabled={busy} />
      </label>}
      <label>Email address
        <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required
          defaultValue={state.email} readOnly={!!state.email && !!verification} disabled={busy} />
      </label>
      {verification ? <label>Verification code
        <input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}"
          minLength={6} maxLength={6} placeholder="000000" required disabled={busy} />
      </label> : <label>Password
        <div className={styles.password}>
          <input name="password" type={showPassword ? 'text' : 'password'} required
            minLength={signingUp ? minLength : undefined} autoComplete={signingUp ? 'new-password' : 'current-password'}
            placeholder={signingUp ? `At least ${minLength} characters` : 'Enter your password'} disabled={busy} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </label>}
      <button className={styles.primary} disabled={busy}>
        {pending ? 'Please wait…' : verification ? 'Verify email & continue' : signingUp ? 'Create account' : 'Sign in'}
        {!pending && <span aria-hidden="true">→</span>}
      </button>
    </form>}

    {verification && <form action={action} className={styles.resend}>
      <input type="hidden" name="intent" value="resend" />
      {state.email ? <input type="hidden" name="email" value={state.email} /> : <input name="email" type="email" placeholder="Your email address" required aria-label="Email for a new code" />}
      <button className={styles.textButton} disabled={busy}>Send a new verification email</button>
    </form>}
    {signingUp && !verification && <button type="button" className={styles.textButton} onClick={() => setEnterCode(true)}>Already have a verification code?</button>}
    <p className={styles.switch}>{signingUp ? 'Already have an account?' : 'New to Social Agent?'}{' '}
      <Link href={signingUp ? '/sign-in' : '/sign-up'}>{signingUp ? 'Sign in' : 'Create an account'}</Link>
    </p>
    <p className={styles.security}>Your account is secured with InsForge.</p>
  </div>;
}

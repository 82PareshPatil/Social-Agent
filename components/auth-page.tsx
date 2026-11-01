import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';
import { AuthForm } from './auth-form';
import styles from './auth.module.css';

export async function AuthPage({ mode, message }: { mode: 'sign-in' | 'sign-up'; message?: string }) {
  const client = await getInsForgeServer();
  const { data: session } = await client.auth.getCurrentUser();
  if (session?.user) redirect('/dashboard');
  const { data: config, error } = await client.auth.getPublicAuthConfig();

  return <main className={styles.shell}>
    <aside className={styles.story}>
      <Link href="/" className={styles.brand}><span>✦</span> Social Agent</Link>
      <div className={styles.storyContent}>
        <span className={styles.badge}>CREATE. CONNECT. GROW.</span>
        <h2>A little inspiration.<br />A lot of possibility.</h2>
        <p>Your ideas deserve an audience. Make room for your next chapter with one workspace for your social presence.</p>
        <div className={styles.orbit} aria-hidden="true"><span>✦</span><i /><b>YOUR NEXT BIG IDEA</b></div>
      </div>
      <p className={styles.storyFooter}>Built for your creative momentum.</p>
    </aside>
    <section className={styles.formSide}>
      <Link href="/" className={styles.back}>← Back to home</Link>
      {error || !config ? <div className={styles.card}><h1>We’ll be right back</h1><p>Authentication is temporarily unavailable. Refresh this page to try again.</p></div>
        : <AuthForm mode={mode} googleEnabled={config.oAuthProviders.includes('google')} minLength={config.passwordMinLength} initialMessage={message} />}
      <p className={styles.footer}>Social Agent · Your ideas, in motion.</p>
    </section>
  </main>;
}

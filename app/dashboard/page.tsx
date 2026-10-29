import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';
import { signOut } from '@/lib/auth-actions';
import styles from '@/components/auth.module.css';

export default async function Dashboard() {
  const client = await getInsForgeServer();
  const { data: session, error: authError } = await client.auth.getCurrentUser();
  if (authError || !session?.user) redirect('/sign-in');
  const { error } = await client.database.rpc('ensure_user_profile');
  if (error) throw new Error('Your profile could not be loaded. Please retry.');
  const { data: profile, error: readError } = await client.database.from('users')
    .select('id, name, email, created_at').eq('id', session.user.id).single();
  if (readError || !profile) throw new Error('Your profile could not be loaded. Please retry.');

  return <main className={styles.dashboard}>
    <header className={styles.dashboardHeader}>
      <Link href="/" className={styles.dashboardBrand}>✦ Social Agent</Link>
      <form action={signOut}><button className={styles.signOut}>Sign out</button></form>
    </header>
    <section className={styles.dashboardContent}>
      <span className={styles.eyebrow}>YOUR WORKSPACE</span>
      <h1>Welcome, {profile.name || 'creator'}.</h1>
      <p className={styles.subtitle}>You’re signed in. Your next chapter starts here.</p>
      <div className={styles.welcomeCard}>
        <span className={styles.avatar}>{String(profile.name || profile.email).slice(0, 1).toUpperCase()}</span>
        <div><h2>Your account is ready</h2><p>{profile.email}</p><span className={styles.status}>● Profile saved</span></div>
      </div>
      <div className={styles.dashboardNote}><h2>A home for your social ideas</h2><p>Your account is connected. Campaign and content tools will appear here as they’re added.</p></div>
    </section>
  </main>;
}

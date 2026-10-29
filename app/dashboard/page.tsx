import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';
import { signOut } from '@/lib/auth-actions';
import { firstCampaign } from '@/lib/campaigns';
import styles from '@/components/auth.module.css';

export default async function Dashboard() {
  const client = await getInsForgeServer();
  const { data: session, error: authError } = await client.auth.getCurrentUser();
  if (authError || !session?.user) redirect('/sign-in');
  const campaign = await firstCampaign(session.user.id);
  if (!campaign) redirect('/create-campaign');
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
      <div className={styles.dashboardNote}><h2>{campaign.icon_url ? <img src={campaign.icon_url} alt="Campaign icon" width={32} height={32}/> : campaign.icon} {campaign.name}</h2><p>Your campaign workspace is ready.</p><img src={campaign.office_image} alt="Your selected AI agent office" style={{width:'100%',maxHeight:420,objectFit:'cover',borderRadius:14}}/></div>
    </section>
  </main>;
}

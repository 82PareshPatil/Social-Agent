import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';
import { firstCampaign } from '@/lib/campaigns';
import { DashboardShell } from '@/components/dashboard-shell';

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

  return <DashboardShell campaign={campaign} name={profile.name || 'Creator'} email={profile.email} />;
}

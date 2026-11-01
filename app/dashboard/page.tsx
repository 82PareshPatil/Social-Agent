import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';
import { firstCampaign } from '@/lib/campaigns';
import { OverviewView } from '@/components/workspace-views';

export default async function Overview() {
  const client = await getInsForgeServer();
  const { data: session } = await client.auth.getCurrentUser();
  if (!session?.user) redirect('/sign-in');
  const campaign = await firstCampaign(session.user.id);
  if (!campaign) redirect('/create-campaign');
  const { data: profile } = await client.database.from('users').select('name').eq('id', session.user.id).single();
  return <OverviewView officeImage={campaign.office_image} campaignName={campaign.name} name={profile?.name || 'Creator'} />;
}

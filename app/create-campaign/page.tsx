import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';
import { firstCampaign } from '@/lib/campaigns';
import { CampaignBuilder } from '@/components/campaign-builder';
export default async function CreateCampaignPage() {
  const client = await getInsForgeServer();
  const { data } = await client.auth.getCurrentUser();
  if (!data?.user) redirect('/sign-in');
  if (await firstCampaign(data.user.id)) redirect('/dashboard');
  return <CampaignBuilder/>;
}

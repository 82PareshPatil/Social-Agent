import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';
import { firstCampaign } from '@/lib/campaigns';
import { AgentsView } from '@/components/workspace-views';

export const metadata: Metadata = { title: 'AI Agent · Social Agent' };

export default async function AgentPage() {
  const client = await getInsForgeServer();
  const { data: session } = await client.auth.getCurrentUser();
  if (!session?.user) redirect('/sign-in');
  const campaign = await firstCampaign(session.user.id);
  if (!campaign) redirect('/create-campaign');
  return <AgentsView officeImage={campaign.office_image} />;
}

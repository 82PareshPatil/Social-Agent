import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';
import { instagramConfigured } from '@/lib/instagram';
import { AccountsView, type Connection } from '@/components/accounts-view';

export const metadata: Metadata = { title: 'Accounts · Social Agent' };

export default async function AccountsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const client = await getInsForgeServer();
  const { data: session } = await client.auth.getCurrentUser();
  if (!session?.user) redirect('/sign-in');
  const { data, error } = await client.database.from('social_connections')
    .select('id, provider, username, account_type, token_expires_at, status').eq('user_id', session.user.id).order('id');
  if (error) throw new Error('Could not load your connected accounts.');
  const params = await searchParams;
  return <AccountsView connections={(data ?? []) as Connection[]} configured={instagramConfigured()}
    connected={params.connected === '1'} error={params.error} />;
}

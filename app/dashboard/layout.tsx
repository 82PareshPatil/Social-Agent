import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const client = await getInsForgeServer();
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) redirect('/sign-in');
  return children;
}

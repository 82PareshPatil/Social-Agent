import { redirect } from 'next/navigation';
import { getInsForgeServer } from '@/lib/insforge-server';
import { signOut } from '@/lib/auth-actions';

export default async function Dashboard() {
  const client = await getInsForgeServer();
  const { data: session, error: authError } = await client.auth.getCurrentUser();
  if (authError || !session?.user) redirect('/sign-in');

  // Idempotent: creates the profile row on first sign-in, refreshes email afterwards.
  const { error } = await client.database.rpc('ensure_user_profile');
  if (error) throw new Error('Your profile could not be loaded. Please retry.');
  const { data: profile, error: readError } = await client.database.from('users')
    .select('id, name, email, created_at').eq('id', session.user.id).single();
  if (readError || !profile) throw new Error('Your profile could not be loaded. Please retry.');

  return <main style={{ padding: '4rem', fontFamily: 'Arial, sans-serif' }}>
    <h1>Welcome, {profile.name || 'Creator'}</h1>
    <p>{profile.email}</p>
    <form action={signOut}><button>Sign out</button></form>
  </main>;
}

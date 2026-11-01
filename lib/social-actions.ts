'use server';

import { revalidatePath } from 'next/cache';
import { getInsForgeServer } from './insforge-server';

export async function disconnectAccount(id: number) {
  const client = await getInsForgeServer();
  const { data } = await client.auth.getCurrentUser();
  if (!data?.user) return;
  await client.database.from('social_connections').delete().eq('id', id).eq('user_id', data.user.id);
  revalidatePath('/dashboard/accounts');
}

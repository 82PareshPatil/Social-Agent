import { insforge } from './insforge';

/** Call with the authenticated SDK session after sign-in or sign-up. */
export async function ensureUserProfile() {
  const { data, error } = await insforge.database.rpc('ensure_user_profile');
  if (error) throw error;
  return data;
}

/** Only the signed-in user's display name is editable through this helper. */
export async function updateUserName(userId: string, name: string) {
  const { data, error } = await insforge.database.from('users')
    .update({ name }).eq('id', userId).select('id, name, email, created_at').single();
  if (error) throw error;
  return data;
}

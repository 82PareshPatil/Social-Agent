import { getInsForgeServer } from './insforge-server';

export async function firstCampaign(userId: string) {
  const client = await getInsForgeServer();
  const { data, error } = await client.database.from('campaigns').select('id,name,icon,icon_url,office_image').eq('user_id', userId).order('id').limit(1);
  if (error) throw new Error('Could not load campaigns');
  return data?.[0] ?? null;
}

'use server';
import { redirect } from 'next/navigation';
import { getInsForgeServer } from './insforge-server';
import { firstCampaign } from './campaigns';

export async function createCampaign(_state: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const client = await getInsForgeServer();
  const { data: session } = await client.auth.getCurrentUser();
  if (!session?.user) redirect('/sign-in');
  if (await firstCampaign(session.user.id)) redirect('/dashboard');
  const name = String(form.get('name') ?? '').trim();
  const icon = String(form.get('icon') ?? '🚀');
  const office = String(form.get('office') ?? '');
  if (!name || name.length > 80 || !['modern-office.png','wooden-office.png'].includes(office)) return { error: 'Enter a campaign name and select an office.' };
  let iconUrl: string | null = null;
  let iconKey: string | null = null;
  const file = form.get('file');
  if (file instanceof File && file.size) {
    if (file.size > 900000 || !['image/png','image/jpeg','image/webp'].includes(file.type)) return { error: 'Choose a PNG, JPEG or WebP image under 900 KB.' };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const valid = (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78) || (bytes[0] === 255 && bytes[1] === 216) || (String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP');
    if (!valid) return { error: 'The uploaded file is not a supported image.' };
    const { data, error } = await client.storage.from('campaign-icons').upload(`${session.user.id}/${crypto.randomUUID()}`, file);
    if (error || !data) return { error: 'Icon upload failed. Please try again.' };
    iconUrl = data.url; iconKey = data.key;
  }
  const { error } = await client.database.from('campaigns').insert([{ user_id: session.user.id, name, icon: iconUrl ? null : icon.slice(0,20), icon_url: iconUrl, icon_key: iconKey, office_image: `/offices/${office}` }]);
  if (error) {
    if (iconKey) await client.storage.from('campaign-icons').remove(iconKey);
    if (await firstCampaign(session.user.id)) redirect('/dashboard');
    return { error: 'Campaign could not be saved. Please try again.' };
  }
  redirect('/dashboard');
}

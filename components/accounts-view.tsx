'use client';

import { useTransition } from 'react';
import { Camera, Plus, Link2Off, ShieldCheck, TriangleAlert } from 'lucide-react';
import { disconnectAccount } from '@/lib/social-actions';
import styles from './accounts-view.module.css';

export type Connection = { id: number; provider: 'instagram'; username: string | null; account_type: string | null; token_expires_at: string | null; status: string };

const errors: Record<string, string> = {
  not_configured: 'Instagram isn’t set up on the server yet. Add the app credentials and try again.',
  denied: 'You cancelled the connection. Nothing was changed.',
  state: 'That sign-in link expired or didn’t match. Please try connecting again.',
  exchange: 'Instagram didn’t accept the connection. Please try again.',
  save: 'We connected to Instagram but couldn’t save the account. Please try again.',
};

const expiry = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export function AccountsView({ connections, configured, connected, error }: {
  connections: Connection[]; configured: boolean; connected: boolean; error?: string;
}) {
  const [pending, start] = useTransition();
  return <div className={styles.page}>
    <div className={styles.heading}>
      <div><span>SOCIAL ACCOUNTS</span><h1>Connect your accounts<b>.</b></h1><p>Link the accounts your agents will publish to. You stay in control and can disconnect any time.</p></div>
    </div>

    {connected && <p className={styles.success} role="status"><ShieldCheck size={16} /> Instagram connected.</p>}
    {error && <p className={styles.error} role="alert"><TriangleAlert size={16} /> {errors[error] ?? 'Something went wrong. Please try again.'}</p>}

    <section className={styles.card} aria-labelledby="ig-title">
      <div className={styles.head}>
        <span className={styles.icon}><Camera size={20} /></span>
        <div><h2 id="ig-title">Instagram</h2><p>Business or Creator accounts · posts and Reels</p></div>
        {/* Plain link on purpose: the OAuth start route redirects to Instagram. */}
        <a className={styles.connect} href="/api/meta/connect" aria-disabled={!configured}><Plus size={15} /> {connections.length ? 'Connect another' : 'Connect Instagram'}</a>
      </div>

      {connections.length === 0
        ? <div className={styles.empty}>
            <span className={styles.art}><Camera size={26} /></span>
            <h3>No Instagram account connected</h3>
            <p>Connect one to let your Scheduler publish posts for you. We only ask for the permissions needed to read basic profile info and publish.</p>
          </div>
        : <ul className={styles.list}>{connections.map((c) => <li key={c.id}>
            <span className={styles.avatar}>{(c.username ?? 'I').slice(0, 1).toUpperCase()}</span>
            <div><strong>@{c.username ?? 'instagram'}</strong><small>{c.account_type ? c.account_type.replace('_', ' ').toLowerCase() : 'Instagram'}{expiry(c.token_expires_at) ? ` · access renews before ${expiry(c.token_expires_at)}` : ''}</small></div>
            <span className={`${styles.status} ${c.status === 'connected' ? styles.ok : styles.warn}`}>{c.status === 'connected' ? 'Connected' : 'Reconnect needed'}</span>
            <button disabled={pending} onClick={() => start(() => disconnectAccount(c.id))} aria-label={`Disconnect @${c.username ?? 'instagram'}`}><Link2Off size={15} /> Disconnect</button>
          </li>)}</ul>}
    </section>
  </div>;
}

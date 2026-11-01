import Link from 'next/link';
import { Rocket, CalendarClock, Activity, Bot, Link2, Sparkles, Plus } from 'lucide-react';
import styles from './overview-cards.module.css';

export type ScheduledPost = { id: string; title: string; platform: string; scheduledFor: string };
export type ActivityItem = { id: string; text: string; at: string };

const steps = [
  { label: 'Campaign created', done: true },
  { label: 'Connect a social account', done: false },
  { label: 'Brief your AI agent', done: false },
  { label: 'Schedule your first post', done: false },
];

/** Campaign status, upcoming scheduled posts and recent activity, with empty states for new users. */
export function OverviewCards({ campaignName, name, scheduled = [], activity = [] }: {
  campaignName: string; name: string; scheduled?: ScheduledPost[]; activity?: ActivityItem[];
}) {
  const done = steps.filter((s) => s.done).length;
  const percent = Math.round((done / steps.length) * 100);

  return <div className={styles.stack}>
    <div className={styles.greeting}>
      <span>A LITTLE FOCUS. A LOT OF POSSIBILITY.</span>
      <h1>Welcome back, {name.split(' ')[0]}<b>.</b></h1>
      <p>Here’s where {campaignName} stands today.</p>
    </div>

    <section className={styles.card} aria-labelledby="status-title">
      <div className={styles.head}>
        <span className={`${styles.icon} ${styles.blue}`}><Rocket size={18} /></span>
        <div><h2 id="status-title">Campaign status</h2><p>{campaignName}</p></div>
        <span className={styles.pill}><i /> Getting started</span>
      </div>
      <div className={styles.progress} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress"><span style={{ width: `${percent}%` }} /></div>
      <div className={styles.meta}><span>{done} of {steps.length} steps complete</span><b>{percent}%</b></div>
      <ul className={styles.steps}>{steps.map((s) => <li key={s.label} className={s.done ? styles.done : ''}><span className={styles.check}>{s.done ? '✓' : ''}</span>{s.label}</li>)}</ul>
      <div className={styles.stats}><div><b>0</b><span>Scheduled</span></div><div><b>0</b><span>Published</span></div><div><b>0</b><span>Drafts</span></div></div>
    </section>

    <section className={styles.card} aria-labelledby="scheduled-title">
      <div className={styles.head}>
        <span className={`${styles.icon} ${styles.pink}`}><CalendarClock size={18} /></span>
        <div><h2 id="scheduled-title">Upcoming scheduled posts</h2><p>What goes live next</p></div>
      </div>
      {scheduled.length === 0
        ? <div className={styles.empty}>
            <span className={`${styles.art} ${styles.pink}`}><CalendarClock size={26} /></span>
            <h3>Nothing scheduled yet</h3>
            <p>Once you plan a post, it will show up here so you always know what’s next.</p>
            <Link href="/dashboard/agent"><Plus size={15} /> Ask your agents for a post</Link>
          </div>
        : <ul className={styles.list}>{scheduled.map((p) => <li key={p.id}><CalendarClock size={16} /><div><strong>{p.title}</strong><small>{p.platform}</small></div><time>{p.scheduledFor}</time></li>)}</ul>}
    </section>

    <section className={styles.card} aria-labelledby="activity-title">
      <div className={styles.head}>
        <span className={`${styles.icon} ${styles.green}`}><Activity size={18} /></span>
        <div><h2 id="activity-title">Recent activity</h2><p>Updates from your workspace</p></div>
      </div>
      {activity.length === 0
        ? <div className={styles.empty}>
            <span className={`${styles.art} ${styles.green}`}><Sparkles size={26} /></span>
            <h3>It’s quiet for now</h3>
            <p>Your agents’ work and publishing updates will appear here as things get moving.</p>
            <div className={styles.hints}><span><Bot size={14} /> Brief your agent</span><span><Link2 size={14} /> Connect an account</span></div>
          </div>
        : <ul className={styles.list}>{activity.map((a) => <li key={a.id}><Activity size={16} /><div><strong>{a.text}</strong></div><time>{a.at}</time></li>)}</ul>}
    </section>
  </div>;
}

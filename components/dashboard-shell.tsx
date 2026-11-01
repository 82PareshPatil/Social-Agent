'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, FileText, CalendarDays, ChartNoAxesCombined, Users, Settings2, PanelLeftClose, PanelLeftOpen, ChevronsUpDown, Plus, Sparkles, ChevronRight, LogOut, X, Check } from 'lucide-react';
import { signOut } from '@/lib/auth-actions';
import styles from './dashboard.module.css';

const menus = [
  { name: 'Overview', icon: LayoutDashboard, color: 'blue', href: '/dashboard' },
  { name: 'AI Agent', icon: Bot, color: 'purple', href: '/dashboard/agent' },
  { name: 'Posts', icon: FileText, color: 'orange', href: null },
  { name: 'Calendar', icon: CalendarDays, color: 'pink', href: null },
  { name: 'Analytics', icon: ChartNoAxesCombined, color: 'green', href: null },
  { name: 'Accounts', icon: Users, color: 'cyan', href: null },
  { name: 'Settings', icon: Settings2, color: 'gray', href: null },
];

type Campaign = { id: number; name: string; icon: string | null; icon_url: string | null; office_image: string };

export function DashboardShell({ campaign, name, email, children }: { campaign: Campaign; name: string; email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const [notice, setNotice] = useState('');
  const dropdown = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function close(event: PointerEvent) { if (!dropdown.current?.contains(event.target as Node)) setSwitcher(false); }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { setSwitcher(false); setNotice(''); } }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, []);
  const icon = campaign.icon_url ? <img src={campaign.icon_url} alt="" /> : campaign.icon || '✦';

  return <div className={`${styles.shell} ${expanded ? styles.expanded : ''}`}>
    <aside className={styles.sidebar} aria-label="Main navigation">
      <Link href="/dashboard" className={styles.logo} aria-label="Social Agent home"><span>✦</span><b>Social Agent<i>WORKSPACE</i></b></Link>
      <div className={styles.campaignControl} ref={dropdown}>
        <button className={styles.campaignButton} onClick={() => setSwitcher(!switcher)} aria-expanded={switcher} aria-controls="campaign-switcher" title={campaign.name}>
          <span className={styles.campaignIcon}>{icon}</span><span className={styles.campaignLabel}><small>CAMPAIGN</small><strong>{campaign.name}</strong></span><ChevronsUpDown size={14}/>
        </button>
        {switcher && <div className={styles.dropdown} id="campaign-switcher"><small>YOUR CAMPAIGNS</small><button onClick={() => setSwitcher(false)}><span className={styles.campaignIcon}>{icon}</span><strong>{campaign.name}</strong><Check size={15}/></button><button onClick={() => { setSwitcher(false); setNotice('Your workspace currently supports one campaign. Additional campaigns will be available in a future update.'); }}><Plus size={17}/> Create new campaign</button></div>}
      </div>
      <span className={styles.navCaption}>WORKSPACE</span>
      <nav>{menus.map(({name:label,icon:Icon,color,href}) => {
        const current = href === '/dashboard' ? pathname === href : !!href && pathname.startsWith(href);
        const inner = <><span className={`${styles.menuIcon} ${styles[color]}`}><Icon size={19} strokeWidth={1.8}/></span><span className={styles.menuLabel}>{label}</span>{current&&<span className={styles.activeDot}/>}</>;
        return href
          ? <Link key={label} href={href} className={`${styles.navItem} ${current?styles.active:''}`} title={label} aria-label={label} aria-current={current?'page':undefined}>{inner}</Link>
          : <button key={label} className={styles.navItem} title={`${label} · coming soon`} aria-label={label} onClick={() => setNotice(`${label} is coming soon. Your dashboard layout is ready.`)}>{inner}</button>;
      })}</nav>
      <div className={styles.sidebarBottom}><button className={styles.collapse} onClick={() => setExpanded(!expanded)} aria-label={expanded?'Collapse sidebar':'Expand sidebar'} aria-expanded={expanded}>{expanded?<PanelLeftClose size={19}/>:<PanelLeftOpen size={19}/>}<span>Collapse sidebar</span></button><form action={signOut}><button className={styles.userButton} title="Sign out"><span className={styles.avatar}>{name.slice(0,1).toUpperCase()}</span><span className={styles.userText}><strong>{name}</strong><small>{email}</small></span><LogOut size={16}/></button></form></div>
    </aside>
    <div className={styles.main}>
      <header className={styles.header}><div className={styles.breadcrumb}>Workspace <ChevronRight size={13}/><strong>{menus.find((m) => m.href === pathname)?.name ?? 'Overview'}</strong></div><div className={styles.headerRight}><span className={styles.connected}><i/> Account connected</span><span className={styles.headerAvatar}>{name.slice(0,1).toUpperCase()}</span></div></header>
      <main className={styles.content}>{children}</main>
    </div>
    {notice&&<div className={styles.notice} role="status"><Sparkles size={18}/><p>{notice}</p><button onClick={()=>setNotice('')} aria-label="Dismiss message"><X size={17}/></button></div>}
  </div>;
}


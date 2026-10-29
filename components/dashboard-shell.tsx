'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Bot, FileText, CalendarDays, ChartNoAxesCombined, Users, Settings2, PanelLeftClose, PanelLeftOpen, ChevronsUpDown, Plus, Sparkles, ChevronRight, LogOut, X, Check } from 'lucide-react';
import { signOut } from '@/lib/auth-actions';
import styles from './dashboard.module.css';

const menus = [
  { name: 'Overview', icon: LayoutDashboard, color: 'blue' },
  { name: 'AI Agent', icon: Bot, color: 'purple' },
  { name: 'Posts', icon: FileText, color: 'orange' },
  { name: 'Calendar', icon: CalendarDays, color: 'pink' },
  { name: 'Analytics', icon: ChartNoAxesCombined, color: 'green' },
  { name: 'Accounts', icon: Users, color: 'cyan' },
  { name: 'Settings', icon: Settings2, color: 'gray' },
];

type Campaign = { id: number; name: string; icon: string | null; icon_url: string | null; office_image: string };

export function DashboardShell({ campaign, name, email }: { campaign: Campaign; name: string; email: string }) {
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
      <nav>{menus.map(({name:label,icon:Icon,color}) => <button key={label} className={`${styles.navItem} ${label==='Overview'?styles.active:''}`} title={label==='Overview'?label:`${label} · coming soon`} aria-label={label} aria-current={label==='Overview'?'page':undefined} onClick={() => label!=='Overview' && setNotice(`${label} is coming soon. Your dashboard layout is ready.`)}><span className={`${styles.menuIcon} ${styles[color]}`}><Icon size={19} strokeWidth={1.8}/></span><span className={styles.menuLabel}>{label}</span>{label==='Overview'&&<span className={styles.activeDot}/>}</button>)}</nav>
      <div className={styles.sidebarBottom}><button className={styles.collapse} onClick={() => setExpanded(!expanded)} aria-label={expanded?'Collapse sidebar':'Expand sidebar'} aria-expanded={expanded}>{expanded?<PanelLeftClose size={19}/>:<PanelLeftOpen size={19}/>}<span>Collapse sidebar</span></button><form action={signOut}><button className={styles.userButton} title="Sign out"><span className={styles.avatar}>{name.slice(0,1).toUpperCase()}</span><span className={styles.userText}><strong>{name}</strong><small>{email}</small></span><LogOut size={16}/></button></form></div>
    </aside>
    <div className={styles.main}>
      <header className={styles.header}><div className={styles.breadcrumb}>Workspace <ChevronRight size={13}/><strong>Overview</strong></div><div className={styles.headerRight}><span className={styles.connected}><i/> Account connected</span><span className={styles.headerAvatar}>{name.slice(0,1).toUpperCase()}</span></div></header>
      <main className={styles.content}>
        <div className={styles.pageHeading}><div><span className={styles.eyebrow}>A LITTLE FOCUS. A LOT OF POSSIBILITY.</span><h1>Your next chapter starts here<span>.</span></h1><p>Welcome back, {name.split(' ')[0]}. Let’s give your ideas a place to grow.</p></div><span className={styles.overviewBadge}><LayoutDashboard size={15}/> Overview</span></div>
        <section className={styles.officeCard} aria-label="Campaign workspace"><img src={campaign.office_image} alt="Your selected AI agent office"/><div className={styles.officeOverlay}/><span className={styles.officeBadge}><span/> YOUR AI WORKSPACE</span><div className={styles.officeCopy}><span className={styles.heroIcon}>{icon}</span><div><small>MAKE SOMETHING GREAT</small><h2>{campaign.name}</h2><p>A space for your ideas. A home for your next big move.</p></div></div><span className={styles.officeCorner}><Sparkles size={16}/> Made for your momentum</span></section>
        <div className={styles.sectionHeading}><h2>A workspace full of possibilities</h2><span>One place. Your entire creative process.</span></div>
        <div className={styles.features}>{[{title:'Meet your AI team',body:'A little extra inspiration for your creative process.',icon:Bot,color:'purple'},{title:'Make room for content',body:'Bring your stories, posts, and big ideas together.',icon:FileText,color:'orange'},{title:'Find your rhythm',body:'A clearer view of what’s next for your campaign.',icon:CalendarDays,color:'pink'}].map(({title,body,icon:Icon,color})=><div className={styles.feature} key={title}><span className={`${styles.featureIcon} ${styles[color]}`}><Icon size={21}/></span><span className={styles.soon}>COMING SOON</span><h3>{title}</h3><p>{body}</p></div>)}</div>
        <footer className={styles.footer}><span>✦ A little inspiration goes a long way.</span><span>Social Agent</span></footer>
      </main>
    </div>
    {notice&&<div className={styles.notice} role="status"><Sparkles size={18}/><p>{notice}</p><button onClick={()=>setNotice('')} aria-label="Dismiss message"><X size={17}/></button></div>}
  </div>;
}


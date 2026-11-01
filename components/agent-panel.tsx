'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle, History, Settings2, X, Sparkles } from 'lucide-react';
import { agentById, type AgentId } from '@/lib/agents';
import styles from './agent-panel.module.css';

type Message = { id: number; from: 'user' | 'agent'; text: string };
type Tab = 'chat' | 'history' | 'settings';

const tabs: { id: Tab; label: string; icon: typeof MessageCircle }[] = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

/** Profile header + Chat / History / Settings tabs. Reused on the Overview and AI Agent pages. */
export function AgentPanel({ agentId, onClose }: { agentId: AgentId; onClose?: () => void }) {
  const agent = agentById(agentId);
  const [tab, setTab] = useState<Tab>('chat');
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [draft, setDraft] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const messages = threads[agentId] ?? [];

  useEffect(() => { setTab('chat'); setDraft(''); }, [agentId]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages.length, tab, agentId]);

  function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim(); if (!text) return;
    setDraft('');
    setThreads((t) => ({ ...t, [agentId]: [...(t[agentId] ?? []), { id: Date.now(), from: 'user', text }] }));
  }

  return <section className={styles.panel} aria-label={`${agent.name} panel`}>
    <header className={styles.header}>
      <span className={`${styles.avatar} ${styles[agent.color]}`} aria-hidden="true">{agent.emoji}</span>
      <div><h2>{agent.name}</h2><p><i /> {agent.tagline}</p></div>
      {onClose && <button className={styles.close} onClick={onClose} aria-label="Close agent chat"><X size={17} /></button>}
    </header>
    <div className={styles.tabs} role="tablist">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={tab === id}
        className={tab === id ? styles.on : ''} onClick={() => setTab(id)}><Icon size={14} />{label}</button>)}
    </div>

    {tab === 'chat' && <>
      <div className={styles.messages} role="log" aria-live="polite">
        <div className={`${styles.bubble} ${styles.agentBubble}`}>{agent.intro}</div>
        {messages.map((m) => <div key={m.id} className={`${styles.bubble} ${m.from === 'user' ? styles.userBubble : styles.agentBubble}`}>{m.text}</div>)}
        {messages.length > 0 && <p className={styles.hint}><Sparkles size={12} /> Live replies from {agent.name} are coming soon.</p>}
        <div ref={end} />
      </div>
      <form className={styles.composer} onSubmit={send}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${agent.name}…`} aria-label={`Message ${agent.name}`} maxLength={2000} />
        <button disabled={!draft.trim()} aria-label="Send message"><Send size={16} /></button>
      </form>
    </>}

    {tab === 'history' && <div className={styles.empty}>
      <span className={`${styles.emptyArt} ${styles[agent.color]}`}><History size={24} /></span>
      <h3>No conversations yet</h3><p>Your past chats with {agent.name} will be saved here.</p>
    </div>}

    {tab === 'settings' && <div className={styles.settings}>
      <h3>About this agent</h3><p>{agent.intro}</p>
      <dl><dt>Role</dt><dd>{agent.tagline}</dd><dt>Takes tasks from</dt><dd>You (for now)</dd><dt>Status</dt><dd>Ready</dd></dl>
    </div>}
  </section>;
}

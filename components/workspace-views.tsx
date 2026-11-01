'use client';

import { useState } from 'react';
import { agents, type AgentId } from '@/lib/agents';
import { AgentPanel } from './agent-panel';
import { OfficePreview } from './office-preview';
import { OverviewCards } from './overview-cards';
import styles from './workspace-views.module.css';

type Props = { officeImage: string; campaignName: string; name: string };

/** Overview: status cards on the left; clicking an agent in the office swaps in its chat, in place. */
export function OverviewView({ officeImage, campaignName, name }: Props) {
  const [selected, setSelected] = useState<AgentId | null>(null);
  return <div className={styles.split}>
    <div className={styles.left}>
      {selected ? <AgentPanel agentId={selected} onClose={() => setSelected(null)} /> : <OverviewCards campaignName={campaignName} name={name} />}
    </div>
    <div className={styles.right}><OfficePreview officeImage={officeImage} selected={selected} onSelect={setSelected} /></div>
  </div>;
}

/** AI Agent page: agent row + tabs on the left, the same office preview on the right, selection kept in sync. */
export function AgentsView({ officeImage }: Pick<Props, 'officeImage'>) {
  const [selected, setSelected] = useState<AgentId>('research');
  return <div className={styles.split}>
    <div className={`${styles.left} ${styles.agentsLeft}`}>
      <div className={styles.row} role="tablist" aria-label="Agents">
        {agents.map((a) => <button key={a.id} role="tab" aria-selected={selected === a.id} onClick={() => setSelected(a.id)}
          className={`${styles.agentCard} ${selected === a.id ? styles.on : ''}`}>
          <span className={`${styles.emoji} ${styles[a.color]}`} aria-hidden="true">{a.emoji}</span>
          <strong>{a.name.replace(' Agent', '')}</strong>
          <small>{a.tagline}</small>
        </button>)}
      </div>
      <div className={styles.panelWrap}><AgentPanel agentId={selected} /></div>
    </div>
    <div className={styles.right}><OfficePreview officeImage={officeImage} selected={selected} onSelect={setSelected} /></div>
  </div>;
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { agents, type AgentId } from '@/lib/agents';
import styles from './office-preview.module.css';

type Character = { id: string; name: string; width: number; height: number; sprite: string; animations: Record<string, string[]> };
type Seat = { id: string; label: string; x: number; y: number; width: number; zIndex: number; character: Character };
type Scene = { office: { width: number; height: number }; seats: Seat[] };

const FRAME_MS = 160;

/** Reusable office scene. Shared by the Overview and AI Agent pages. */
export function OfficePreview({ officeImage, selected, onSelect }: {
  officeImage: string; selected: AgentId | null; onSelect: (id: AgentId) => void;
}) {
  const [scene, setScene] = useState<Scene | null>(null);
  const [failed, setFailed] = useState(false);
  const [frame, setFrame] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const box = useRef<HTMLDivElement>(null);
  const name = officeImage.includes('wooden') ? 'wooden-office' : 'modern-office';

  useEffect(() => {
    let cancelled = false;
    setScene(null); setFailed(false);
    fetch(`/office-studio/${name}.json`).then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: Scene) => { if (!cancelled) setScene(data); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [name]);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setFrame((f) => f + 1), FRAME_MS);
    return () => clearInterval(timer);
  }, [scene]);

  // Fit the whole scene (every agent stays visible) while keeping every character at a fixed position relative to the background.
  const stage = useMemo(() => {
    if (!scene || !size.w || !size.h) return null;
    const ratio = scene.office.width / scene.office.height;
    const w = Math.min(size.w, size.h * ratio);
    return { w, h: w / ratio };
  }, [scene, size]);

  return <div className={styles.frame} ref={box} style={{ ['--office' as string]: `url(${officeImage})` }}>
    {stage && scene && <div className={styles.stage} style={{ width: stage.w, height: stage.h }}>
      <img className={styles.background} src={officeImage} alt="AI agent office" draggable={false} />
      {scene.seats.slice(0, agents.length).map((seat, index) => {
        const agent = agents[index];
        const frames = seat.character.animations.typing ?? [seat.character.sprite];
        const w = seat.width / scene.office.width;
        const h = (seat.width * seat.character.height / seat.character.width) / scene.office.height;
        const active = selected === agent.id;
        return <button key={seat.id} type="button" className={`${styles.agent} ${active ? styles.active : ''}`}
          style={{ left: `${seat.x / scene.office.width * 100}%`, top: `${seat.y / scene.office.height * 100}%`, width: `${w * 100}%`, height: `${h * 100}%`, zIndex: seat.zIndex + (active ? 10 : 0) }}
          onClick={() => onSelect(agent.id)} aria-pressed={active} aria-label={`${agent.name}: open chat`}>
          <span className={`${styles.popover} ${styles[agent.color]}`}><i aria-hidden="true">{agent.emoji}</i>{agent.name}</span>
          <img src={frames[frame % frames.length]} alt="" draggable={false} />
        </button>;
      })}
    </div>}
    {!scene && !failed && <div className={styles.loading} role="status"><span />Loading your office…</div>}
    {failed && <div className={styles.loading} role="alert">Couldn’t load the office layout. Refresh to try again.</div>}
  </div>;
}

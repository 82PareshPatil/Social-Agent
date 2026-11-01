'use client';
import { useActionState, useState } from 'react';
import { createCampaign } from '@/lib/campaign-actions';
import styles from './campaign.module.css';

export function CampaignBuilder() {
  const [step,setStep] = useState(1);
  const [name,setName] = useState('');
  const [icon,setIcon] = useState('🚀');
  const [office,setOffice] = useState('modern-office.png');
  const [state,action,pending] = useActionState(createCampaign, {});
  return <main className={styles.shell}>
    <header><a href="/">✦ Social Agent</a><span>YOUR CREATIVE WORKSPACE</span></header>
    <form action={action} className={styles.card} onSubmit={e => { if(step===1){e.preventDefault();if(name.trim())setStep(2);} }}>
      <div className={styles.heading}><small>LET’S MAKE IT YOURS</small><h1>{step===1?'Every big idea starts here.':'Pick your creative space.'}</h1><p>{step===1?'Give your campaign a name and a little personality.':'Choose the office your AI team will call home.'}</p><div className={styles.steps}><b>✓ Campaign details</b><span>—</span><b style={{opacity:step===2?1:.4}}>02 Your office</b></div></div>
      <section hidden={step!==1} className={styles.details}>
        <label>Campaign name<input name="name" value={name} onChange={e=>setName(e.target.value)} required maxLength={80} placeholder="e.g. The next big launch" /></label>
        <label>Choose an icon</label><div className={styles.icons}>{['🚀','✨','🎯','🌱','💡','🎨','📣','⚡'].map(x=><button type="button" key={x} aria-label={`Select ${x}`} aria-pressed={icon===x} onClick={()=>setIcon(x)} className={icon===x?styles.selected:''}>{x}</button>)}</div>
        <label className={styles.upload}>Or upload your own icon<input type="file" name="file" accept="image/png,image/jpeg,image/webp" /><small>PNG, JPEG or WebP · up to 900 KB</small></label>
      </section>
      <section hidden={step!==2} className={styles.offices}>{[['modern-office.png','The Skyline Studio','Bright ideas. Bigger possibilities.'],['wooden-office.png','The Woodland Studio','A warm space for your best work.']].map(([file,title,description])=><button type="button" key={file} aria-pressed={office===file} className={office===file?styles.selected:''} onClick={()=>setOffice(file)}><img src={`/offices/${file}`} alt={title}/><div><strong>{title}</strong><span>{office===file?'● Selected':'○ Select office'}</span><p>{description}</p></div></button>)}</section>
      <input type="hidden" name="icon" value={icon}/><input type="hidden" name="office" value={office}/>
      {state.error&&<p role="alert" className={styles.error}>{state.error}</p>}
      <footer><span>{step===1?'Step 1 of 2':'One last step. Then you’re in.'}</span>{step===2&&<button type="button" disabled={pending} onClick={()=>setStep(1)}>← Back</button>}{step===1?<button type="button" className={styles.primary} disabled={!name.trim()} onClick={()=>setStep(2)}>Next: choose your office →</button>:<button className={styles.primary} disabled={pending}>{pending?'Creating…':'Create campaign →'}</button>}</footer>
    </form><p className={styles.note}>A little setup. A world of possibilities.</p>
  </main>;
}

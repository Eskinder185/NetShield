import type { ReactNode } from 'react';
import { Pill, TechDetails } from './ui';
import { SEVERITY } from '../lib/plain';

/**
 * The one shape every meaningful issue uses:
 * What happened → Why it matters → What I can do → How we'll check it worked.
 */
export function AlertCard({ level = 3, severity, title, what, why, todo, verify, evidence, tech, actions, status }: {
  level?: 2 | 3; severity: keyof typeof SEVERITY; title: string; what: ReactNode; why?: ReactNode; todo: ReactNode; verify?: ReactNode;
  evidence?: ReactNode; tech?: ReactNode; actions?: ReactNode; status?: ReactNode;
}) {
  const sev = SEVERITY[severity];
  const H = (level === 2 ? 'h2' : 'h3') as 'h2' | 'h3';
  return (
    <article className="card alert-card" aria-label={title}>
      <div className="row-between">
        <H className="card-title" style={{ margin: 0 }}>{title}</H>
        <div className="row"><Pill tone={sev.tone}>{sev.label}</Pill>{status}</div>
      </div>
      <div className="alert-flow">
        <div><h4>What happened</h4><p>{what}</p></div>
        {why && <div><h4>Why it matters</h4><p>{why}</p></div>}
        <div><h4>What you can do</h4><p>{todo}</p></div>
        {verify && <div><h4>How we&apos;ll check it worked</h4><p>{verify}</p></div>}
      </div>
      {evidence && <p className="faint" style={{ margin: 0 }}><strong>Evidence:</strong> {evidence}</p>}
      {actions && <div className="row">{actions}</div>}
      {tech && <TechDetails>{tech}</TechDetails>}
    </article>
  );
}

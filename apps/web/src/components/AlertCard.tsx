import type { ReactNode } from 'react';
import { Pill, TechDetails } from './ui';
import { SEVERITY } from '../lib/plain';

/**
 * The one shape every meaningful issue uses:
 * What happened → Why it matters → What I can do → How we'll check it worked.
 */
export function AlertCard({ severity, title, what, why, todo, verify, evidence, tech, actions, status }: {
  severity: keyof typeof SEVERITY; title: string; what: ReactNode; why?: ReactNode; todo: ReactNode; verify?: ReactNode;
  evidence?: ReactNode; tech?: ReactNode; actions?: ReactNode; status?: ReactNode;
}) {
  const sev = SEVERITY[severity];
  return (
    <article className="card alert-card" aria-label={title}>
      <div className="row-between">
        <h3 style={{ margin: 0 }}>{title}</h3>
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

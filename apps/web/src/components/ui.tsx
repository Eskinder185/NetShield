import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, ChevronDown, CircleHelp, Info, Loader2, MinusCircle, ShieldAlert, FlaskConical, type LucideIcon,
} from 'lucide-react';
import type { Tone } from '../lib/plain';

/* ---------- Logo ---------- */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="logo" aria-label="NetShield">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
                <path d="M32 4 9 13v17c0 14 9.5 25.5 23 30 13.5-4.5 23-16 23-30V13z" fill="#22c5e0" />
        <path d="M20 33c4-7 8-10.5 12-10.5S40 26 44 33" fill="none" stroke="#04202b" strokeWidth="4" strokeLinecap="round" />
        <circle cx="32" cy="40" r="3.5" fill="#04202b" />
      </svg>
      <span className="logo-word">NetShield</span>
    </span>
  );
}

/* ---------- Button / link-button ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: 'sm' | 'md' | 'lg'; block?: boolean; busy?: boolean; icon?: LucideIcon }
const cls = (v: Variant, s: string, block?: boolean) => `btn btn-${v}${s !== 'md' ? ` btn-${s}` : ''}${block ? ' btn-block' : ''}`;

export function Button({ variant = 'primary', size = 'md', block, busy, icon: Icon, children, disabled, ...rest }: BtnProps) {
  return (
    <button className={cls(variant, size, block)} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy ? <Loader2 size={18} className="spin-icon" aria-hidden="true" /> : Icon ? <Icon size={18} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function LinkButton({ to, variant = 'primary', size = 'md', block, icon: Icon, children, external }: {
  to: string; variant?: Variant; size?: 'sm' | 'md' | 'lg'; block?: boolean; icon?: LucideIcon; children: ReactNode; external?: boolean;
}) {
  const inner = <>{Icon && <Icon size={18} aria-hidden="true" />}{children}</>;
  return external
    ? <a className={cls(variant, size, block)} href={to}>{inner}</a>
    : <Link className={cls(variant, size, block)} to={to}>{inner}</Link>;
}

/* ---------- Status pill (icon + words, never colour alone) ---------- */
const TONE_ICON: Record<Tone, LucideIcon> = { ok: CheckCircle2, warn: AlertTriangle, danger: ShieldAlert, info: Info, neutral: MinusCircle };
export function Pill({ tone, children, icon }: { tone: Tone | 'demo'; children: ReactNode; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'demo' ? FlaskConical : TONE_ICON[tone]);
  return <span className={`pill pill-${tone}`}><Icon size={14} aria-hidden="true" />{children}</span>;
}

/* ---------- Banner ---------- */
export function Banner({ tone = 'info', title, children, role }: { tone?: 'info' | 'warn' | 'danger' | 'ok' | 'demo'; title?: string; children?: ReactNode; role?: 'status' | 'alert' }) {
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'danger' ? ShieldAlert : tone === 'warn' ? AlertTriangle : tone === 'demo' ? FlaskConical : Info;
  return (
    <div className={`banner banner-${tone}`} role={role}>
      <Icon size={20} aria-hidden="true" />
      <div>{title && <p className="banner-title">{title}</p>}{children}</div>
    </div>
  );
}

/* ---------- Empty / loading / error states ---------- */
export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={28} aria-hidden="true" /></div>
      <h3>{title}</h3>
      {children && <div className="muted" style={{ maxWidth: 520, margin: '0 auto var(--space-4)' }}>{children}</div>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="stack" style={{ padding: 'var(--space-4) 0' }}>
      <span className="sr-only">{label}…</span>
      <div className="skeleton" style={{ height: 28, width: '55%' }} />
      <div className="skeleton" style={{ height: 90 }} />
      <div className="skeleton" style={{ height: 90 }} />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Banner tone="danger" title="We couldn't load this" role="alert">
      <p>{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </Banner>
  );
}

/* ---------- Disclosure (FAQ, technical details) ---------- */
export function Disclosure({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="disclosure">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span>{title}</span><ChevronDown size={20} aria-hidden="true" />
      </button>
      {open && <div id={id} className="disclosure-panel">{children}</div>}
    </div>
  );
}

/** "Show technical details": progressive disclosure for expert information. */
export function TechDetails({ children, label = 'technical details' }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div>
      <button type="button" className="tech-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'Show'} {label}
      </button>
      {open && <div id={id} className="tech-details">{children}</div>}
    </div>
  );
}

/* ---------- Help tooltip (click/focus, not hover-only) ---------- */
export function Help({ term, children }: { term: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" className="tooltip-btn" aria-label={`What does "${term}" mean?`} aria-expanded={open} aria-describedby={open ? id : undefined}
        onClick={() => setOpen(!open)} onBlur={() => setOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
        <CircleHelp size={14} aria-hidden="true" />
      </button>
      {open && <span id={id} role="tooltip" className="help-pop">{children}</span>}
    </span>
  );
}

/* ---------- Dialog (native <dialog>: focus trap, Esc, backdrop) ---------- */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onClose={onClose} onCancel={onClose}>
      {open && (<><h2 id={titleId} style={{ fontSize: '1.4rem' }}>{title}</h2>{children}</>)}
    </dialog>
  );
}

/* ---------- Form field ---------- */
export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: (p: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode }) {
  const id = useId();
  const hid = `${id}-h`, eid = `${id}-e`;
  const describedby = [hint ? hid : '', error ? eid : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-describedby': describedby, 'aria-invalid': error ? true : undefined })}
      {hint && <span id={hid} className="hint">{hint}</span>}
      {error && <span id={eid} className="error-text" role="alert"><AlertTriangle size={15} aria-hidden="true" />{error}</span>}
    </div>
  );
}

/* ---------- Stepper ---------- */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="steps" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} className={i < current ? 'done' : ''} aria-current={i === current ? 'step' : undefined}>{s}</li>
      ))}
    </ol>
  );
}

/* ---------- Demo marker ---------- */
export function DemoTag() {
  return <Pill tone="demo">Demo · synthetic data</Pill>;
}

/* ---------- Accessible line chart ---------- */
export function LineChart({ values, label, unit = 'ms', failures = [] }: { values: (number | null)[]; label: string; unit?: string; failures?: number[] }) {
  const W = 560, H = 160, P = 28;
  const nums = values.filter((v): v is number => v !== null);
  const max = Math.max(10, ...nums) * 1.15;
  const x = (i: number) => P + (i * (W - P * 2)) / Math.max(1, values.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - P * 2);
  let d = '';
  let pen = false;
  values.forEach((v, i) => { if (v === null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `; pen = true; });
  const summary = nums.length
    ? `${label}. ${values.length} checks; lowest ${Math.min(...nums).toFixed(1)} ${unit}, highest ${Math.max(...nums).toFixed(1)} ${unit}; ${values.length - nums.length} failed.`
    : `${label}. No successful checks.`;
  return (
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        {[0, 0.5, 1].map((t) => <line key={t} className="chart-grid" x1={P} x2={W - P} y1={H - P - t * (H - P * 2)} y2={H - P - t * (H - P * 2)} />)}
        <line className="chart-axis" x1={P} x2={P} y1={P / 2} y2={H - P} />
        <line className="chart-axis" x1={P} x2={W - P} y1={H - P} y2={H - P} />
        <text className="chart-text" x={4} y={y(max) + 10}>{Math.round(max)}</text>
        <text className="chart-text" x={4} y={H - P}>0</text>
        {d && <path className="chart-line" d={d} />}
        {failures.map((i) => <g key={i}><rect className="chart-bad" x={x(i) - 3} y={H - P - 10} width={6} height={10} rx={2} /></g>)}
      </svg>
      <figcaption className="faint">{summary}</figcaption>
    </figure>
  );
}

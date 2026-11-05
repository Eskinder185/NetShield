import { useContext, useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { Banner, Button, Disclosure, Field, Pill, TechDetails } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import { useAsync } from '../../lib/hooks';
import { useWorkspace, WorkspaceContext } from '../../lib/workspace';
import { ErrorState, Loading } from '../../components/ui';
import type { ScamCase, ScamIncidentType, UrlResult } from '../../lib/types';

const EXAMPLES = ['https://www.wikipedia.org/wiki/Cat', 'http://paypa1-secure-login.top/verify', 'https://paypal.com@evil.example/login', 'http://192.168.4.20/login'];
const DEMO_LINK_RESULTS: UrlResult[] = [
  { level: 'NO_WARNING_SIGNS', headline: 'No obvious text warnings in this example', summary: 'The sample address has a familiar-looking domain. This is not a safety guarantee.', host: 'www.wikipedia.org', signals: [], limits: 'Demo result. No reputation, page content, redirects, or actual site was checked.' },
  { level: 'SUSPICIOUS', headline: 'This example imitates a familiar brand', summary: 'The domain uses a digit in place of a letter and an unfamiliar ending.', host: 'paypa1-secure-login.top', signals: [{ code: 'DEMO_LOOKALIKE', title: 'Lookalike spelling', detail: 'The “1” can be mistaken for an “l”.', weight: 3 }], limits: 'Synthetic example only. The address was not visited.' },
  { level: 'SUSPICIOUS', headline: 'The real host is hidden after an @ sign', summary: 'The site name before the @ is not the destination in this example.', host: 'evil.example', signals: [{ code: 'DEMO_AT_SIGN', title: 'Misleading site name', detail: 'The destination is after the @ sign.', weight: 3 }], limits: 'Synthetic example only. The address was not visited.' },
  { level: 'CAUTION', headline: 'This example uses a local IP address', summary: 'There is no recognizable public site name to confirm.', host: '192.168.4.20', signals: [{ code: 'DEMO_IP_HOST', title: 'IP address', detail: 'The address does not identify an organization.', weight: 2 }], limits: 'Synthetic example only. The address was not visited.' },
];

const LEVEL = {
  SUSPICIOUS: { tone: 'danger', label: 'Several warning signs', Icon: ShieldAlert },
  CAUTION: { tone: 'warn', label: 'A few things to double-check', Icon: AlertTriangle },
  NO_WARNING_SIGNS: { tone: 'info', label: 'No warning signs spotted (not a safety guarantee)', Icon: ShieldQuestion },
  MALFORMED: { tone: 'neutral', label: "Couldn't read this as a web link", Icon: ShieldQuestion },
} as const;

export function LinkChecker() {
  // Also used on the public site, which has no workspace provider.
  const ws = useContext(WorkspaceContext);
  const [url, setUrl] = useState('');
  const [res, setRes] = useState<UrlResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function check(u: string) {
    setBusy(true); setErr(null); setRes(null);
    try {
      if (ws?.mode === 'demo') {
        const index = EXAMPLES.indexOf(u);
        if (index < 0) throw new Error('The demo only shows the four preset sample links. Sign in to check your own link.');
        setRes(DEMO_LINK_RESULTS[index]);
      } else setRes(await api.inspectUrl(u));
    } catch (e) { setErr(e instanceof ApiError || e instanceof Error ? e.message : 'Something went wrong.'); } finally { setBusy(false); }
  }
  const L = res ? LEVEL[res.level] : null;
  return (
    <div className="stack">
      <form onSubmit={(e) => { e.preventDefault(); void check(url); }}>
        <Field label="Paste a link, or the web address from a QR code" hint={ws?.mode === 'demo' ? 'In the demo, only the preset sample links below are checked, entirely in this browser.' : "We read the link's text only. We never open it, and we don't store what you paste."}>
          {(p) => <input {...p} className="input" type="text" inputMode="url" autoComplete="off" spellCheck={false} maxLength={2048} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />}
        </Field>
        <Button type="submit" icon={Search} busy={busy} disabled={!url.trim()}>Check this link</Button>
      </form>
      <div>
        <p className="faint" style={{ marginBottom: 6 }}>Not sure? Try a sample link:</p>
        <div className="chips">{EXAMPLES.map((e) => <button key={e} type="button" className="chip" style={{ fontSize: '0.85rem' }} onClick={() => { setUrl(e); void check(e); }}>{e.length > 38 ? e.slice(0, 36) + '…' : e}</button>)}</div>
      </div>
      <div aria-live="polite">
        {err && <Banner tone="danger" title="Couldn't check that link" role="alert"><p>{err}</p></Banner>}
        {res && L && (
          <div className="card stack">
            <div className="row"><L.Icon size={24} aria-hidden="true" /><Pill tone={L.tone}>{L.label}</Pill></div>
            <h3 style={{ margin: 0 }}>{res.headline}</h3>
            <p>{res.summary}</p>
            {res.signals.length > 0 && (
              <div><h4>What we noticed</h4>
                <ul>{res.signals.map((s) => <li key={s.code}><strong>{s.title}.</strong> {s.detail}</li>)}</ul></div>
            )}
            <Banner tone="info" title="What this check can't tell you"><p>{res.limits}</p></Banner>
            <TechDetails><p>Site name read as: <code>{res.host ?? 'n/a'}</code></p><p style={{ marginBottom: 0 }}>Signal codes: {res.signals.map((s) => s.code).join(', ') || 'none'}</p></TechDetails>
          </div>
        )}
      </div>
    </div>
  );
}

const CLICKED = [
  ['Stop and don\'t enter anything else', 'Close the page. If it asked for a password, code, or card number and you gave it, go on to the next steps right away.'],
  ['Disconnect if you downloaded something', 'If a file was downloaded or an app installed, turn off Wi-Fi on that device and don\'t open the file.'],
  ['Change passwords from a different device', 'Start with email, then banking. If you reused the password elsewhere, change those too.'],
  ['Turn on two-step sign-in', 'Use an authenticator app or passkey on your email and bank so a stolen password isn\'t enough.'],
  ['Call your bank if money or cards are involved', 'Use the phone number on your card or their official website, never one from the message.'],
  ['Run your device\'s built-in security scan', 'Windows Security, macOS XProtect or your phone\'s built-in protection are good places to start.'],
  ['Report it', 'Forward scam texts to 7726 (US) and report phishing to your email provider. Telling friends and family helps too.'],
];

const SCENARIOS = [
  ['Delivery text', "“Your package couldn't be delivered, pay $1.99 to reschedule.” Real carriers don't ask for payment by text link. Open the carrier's app or website yourself."],
  ['Tech-support pop-up', 'A warning with a phone number saying your computer is infected. Real alerts never ask you to call a number. Close the browser.'],
  ['Bank alert', 'A message saying your account is locked, with a link. Call the number on your card instead of tapping the link.'],
  ['Job offer', 'Offers that pay a lot for little work, or ask you to buy equipment or cash a cheque. Real employers don\'t ask for money up front.'],
  ['Marketplace buyer', 'A buyer who overpays and asks you to refund the difference, or insists on moving to another app. Stay on the platform.'],
  ['Romance or friend in trouble', 'Someone you\'ve only met online asks for money urgently. Pause and talk to someone you trust first.'],
];

const RESCUE_CHOICES: { type: ScamIncidentType; label: string }[] = [
  { type: 'LINK', label: 'I clicked a suspicious link' },
  { type: 'PASSWORD', label: 'I entered a password' },
  { type: 'PERSONAL_INFO', label: 'I shared personal information' },
  { type: 'MONEY', label: 'I sent money' },
  { type: 'DOWNLOAD', label: 'I downloaded something' },
  { type: 'IMPERSONATION', label: 'Someone pretended to be a company' },
  { type: 'DELIVERY', label: 'I got a suspicious delivery message' },
  { type: 'ACCOUNT_ACCESS', label: 'Someone may have accessed my account' },
];

function ScamRescue() {
  const ws = useWorkspace();
  const cases = useAsync(() => ws.getScamCases(), [ws]);
  const [active, setActive] = useState<ScamCase | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function start(type: ScamIncidentType) {
    setBusy(true); setErr(null);
    try { setActive(await ws.startScamCase(type)); cases.reload(); } catch (e) { setErr(e instanceof Error ? e.message : 'Could not start recovery.'); } finally { setBusy(false); }
  }
  async function open(id: string) {
    setBusy(true); setErr(null); setConfirmDelete(false);
    try { setActive(await ws.getScamCase(id)); } catch (e) { setErr(e instanceof Error ? e.message : 'Could not open recovery.'); } finally { setBusy(false); }
  }
  async function mark(key: string, done: boolean) {
    if (!active) return;
    setBusy(true); setErr(null);
    try { setActive(await ws.setScamStep(active.id, key, done)); cases.reload(); } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save this step.'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!active) return;
    setBusy(true); setErr(null);
    try { await ws.deleteScamCase(active.id); setActive(null); setConfirmDelete(false); cases.reload(); } catch (e) { setErr(e instanceof Error ? e.message : 'Could not delete this case.'); } finally { setBusy(false); }
  }
  const title = (type: ScamIncidentType) => RESCUE_CHOICES.find((choice) => choice.type === type)?.label ?? type;
  const exportUrl = active && (ws.scamExportUrl?.(active.id) ?? `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ dataSource: 'DEMO_SYNTHETIC', ...active }, null, 2))}`);
  return <section className="card stack" aria-labelledby="rescue-h">
    <div><h2 id="rescue-h" style={{ fontSize: '1.4rem' }}>I think I got scammed</h2>
      <p className="muted">Take one step at a time. Choose what happened and we&apos;ll make a recovery checklist you can return to.</p></div>
    <Banner tone="info" title="Keep private details out of NetShield"><p>We only save the type of incident and which steps you mark done. Never enter passwords, recovery codes, card numbers or account details here. A checked step is your report, not technical verification. Cases are removed after 30 days, or you can delete them now.</p></Banner>
    {err && <ErrorState message={err} />}
    <div className="chips" role="group" aria-label="What happened">
      {RESCUE_CHOICES.map((choice) => <button key={choice.type} type="button" className="chip" disabled={busy} onClick={() => void start(choice.type)}>{choice.label}</button>)}
    </div>
    {cases.loading ? <Loading label="Loading recovery cases" /> : cases.error ? <ErrorState message={cases.error} onRetry={cases.reload} /> : cases.data && cases.data.length > 0 && <div>
      <h3>Saved recovery cases</h3>
      <div className="chips" role="group" aria-label="Saved recovery cases">
        {cases.data.map((item) => <button key={item.id} type="button" className="chip" aria-pressed={active?.id === item.id} disabled={busy} onClick={() => void open(item.id)}>{title(item.incident_type)} · {new Date(item.created_at).toLocaleDateString()}</button>)}
      </div>
    </div>}
    {busy && <p role="status">Saving recovery progress…</p>}
    {active && <div className="card card-flat stack">
      <div><h3>{title(active.incident_type)}</h3><p className="faint">Started {new Date(active.created_at).toLocaleString()} · {active.steps.filter((s) => s.done).length} of {active.steps.length} steps you marked done</p></div>
      <ol className="stack">{active.steps.map((step) => <li key={step.step_key}>
        <label className="check"><input type="checkbox" checked={step.done} disabled={busy} onChange={(e) => void mark(step.step_key, e.target.checked)} />
          <span><strong>{step.title}</strong><br /><span className="muted">{step.guidance}</span>{step.completed_at && <><br /><span className="faint">You marked this done {new Date(step.completed_at).toLocaleString()}</span></>}</span></label>
      </li>)}</ol>
      <div className="row">
        {exportUrl && <a className="btn btn-secondary btn-sm" href={exportUrl} download="netshield-scam-recovery.json">Export summary</a>}
        {!confirmDelete ? <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>Delete this case</Button> : <>
          <Button size="sm" variant="danger" disabled={busy} onClick={() => void remove()}>Confirm delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
        </>}
      </div>
    </div>}
  </section>;
}

export function ScamShield() {
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Scam Shield</h1>
        <p className="muted">Get help after a suspected scam, or check a link before you open it.</p>
      </div>
      <ScamRescue />
      <div className="card"><LinkChecker /></div>

      <section aria-labelledby="clicked-h" className="card stack">
        <h2 id="clicked-h" style={{ fontSize: '1.4rem' }}>I clicked a bad link. What now?</h2>
        <p className="muted">Don&apos;t panic. Clicking alone rarely does harm; entering information or downloading something is what matters. Go through these in order.</p>
        <ol>{CLICKED.map(([t, d]) => <li key={t}><strong>{t}.</strong> <span className="muted">{d}</span></li>)}</ol>
      </section>

      <section aria-labelledby="learn-h" className="stack">
        <h2 id="learn-h" style={{ fontSize: '1.4rem' }}>Common scams</h2>
        {SCENARIOS.map(([t, d]) => <Disclosure key={t} title={<><CheckCircle2 size={0} aria-hidden="true" />{t}</>}><p style={{ marginBottom: 0 }}>{d}</p></Disclosure>)}
      </section>
    </div>
  );
}

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { Banner, Button, Disclosure, Field, Pill, TechDetails } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { UrlResult } from '../../lib/types';

const EXAMPLES = ['https://www.wikipedia.org/wiki/Cat', 'http://paypa1-secure-login.top/verify', 'https://paypal.com@evil.example/login', 'http://192.168.4.20/login'];

const LEVEL = {
  SUSPICIOUS: { tone: 'danger', label: 'Several warning signs', Icon: ShieldAlert },
  CAUTION: { tone: 'warn', label: 'A few things to double-check', Icon: AlertTriangle },
  NO_WARNING_SIGNS: { tone: 'info', label: 'No warning signs spotted (not a safety guarantee)', Icon: ShieldQuestion },
  MALFORMED: { tone: 'neutral', label: "Couldn't read this as a web link", Icon: ShieldQuestion },
} as const;

export function LinkChecker() {
  const [url, setUrl] = useState('');
  const [res, setRes] = useState<UrlResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function check(u: string) {
    setBusy(true); setErr(null); setRes(null);
    try { setRes(await api.inspectUrl(u)); } catch (e) { setErr(e instanceof ApiError ? e.message : 'Something went wrong.'); } finally { setBusy(false); }
  }
  const L = res ? LEVEL[res.level] : null;
  return (
    <div className="stack">
      <form onSubmit={(e) => { e.preventDefault(); void check(url); }}>
        <Field label="Paste a link, or the web address from a QR code" hint="We read the link's text only. We never open it, and we don't store what you paste.">
          {(p) => <input {...p} className="input" type="text" inputMode="url" autoComplete="off" spellCheck={false} maxLength={2048} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />}
        </Field>
        <Button type="submit" icon={Search} busy={busy} disabled={!url.trim()}>Check this link</Button>
      </form>
      <div>
        <p className="faint" style={{ marginBottom: 6 }}>Not sure? Try an example (these are fake):</p>
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

export function ScamShield() {
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Scam Shield</h1>
        <p className="muted">Not sure about a link or a message? Check it here before you tap.</p>
      </div>
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

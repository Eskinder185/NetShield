import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, CircleSlash, Loader2 } from 'lucide-react';
import { Banner, Button, Logo, Pill, Stepper } from '../../components/ui';
import { SensorSetup } from './More';
import { useWorkspace } from '../../lib/workspace';
import { VERDICT_META } from '../../lib/plain';
import type { Diagnosis } from '../../lib/types';

const GOALS = ['My internet is slow or unreliable', 'I want to know who is on my Wi-Fi', 'I want help spotting scams', "I'm just looking around"];
const STEPS = ['Your goal', 'What you need', 'Home sensor', 'Permissions', 'First check', 'Done'];

export function Onboarding() {
  const ws = useWorkspace();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [busy, setBusy] = useState(false);
  const needsSensor = goal !== GOALS[2];

  useEffect(() => {
    if (step !== 4) return;
    let live = true;
    const tick = async () => {
      try { const s = await ws.getSensors(); if (live) { setOnline(s.anyOnline); if (s.anyOnline) setDiag(await ws.getDiagnosis()); } } catch { /* shown as not connected */ }
    };
    void tick();
    const t = setInterval(tick, 5000);
    return () => { live = false; clearInterval(t); };
  }, [step, ws]);

  async function createSensor() {
    setBusy(true); setErr(null);
    try { const r = await ws.enroll('Home sensor'); setToken(r.token); } catch (e) { setErr(e instanceof Error ? e.message : 'Could not create the sensor token'); } finally { setBusy(false); }
  }
  async function saveConsent() {
    setBusy(true); setErr(null);
    try { await ws.saveSettings({ ...ws.settings, consentDeviceInventory: consent }); setStep(4); } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save'); } finally { setBusy(false); }
  }

  return (
    <div className="auth-wrap">
      <main id="main" className="card" style={{ width: 'min(720px, 100%)' }}>
        <div className="row-between"><Logo /><Link to="/app">Skip setup</Link></div>
        <h1 style={{ fontSize: '1.8rem', marginTop: 20 }}>Let&apos;s get your home set up</h1>
        <Stepper steps={STEPS} current={step} />
        {err && <div style={{ marginBottom: 16 }}><Banner tone="danger" role="alert"><p>{err}</p></Banner></div>}

        {step === 0 && (
          <div className="stack">
            <h2 style={{ fontSize: '1.3rem' }}>What would you like help with first?</h2>
            <div className="chips" role="group" aria-label="Goal">{GOALS.map((g) => <button key={g} type="button" className="chip" aria-pressed={goal === g} onClick={() => setGoal(g)}>{g}</button>)}</div>
            <Button disabled={!goal} onClick={() => setStep(1)}>Continue</Button>
          </div>
        )}
        {step === 1 && (
          <div className="stack">
            <h2 style={{ fontSize: '1.3rem' }}>What NetShield can do with and without the home sensor</h2>
            <div className="table-wrap"><table><thead><tr><th>Feature</th><th>Needs</th></tr></thead><tbody>
              <tr><td>Check links for scam signs</td><td><Pill tone="ok">Works in your browser</Pill></td></tr>
              <tr><td>Find out why your internet is slow</td><td><Pill tone="info">Home sensor</Pill></td></tr>
              <tr><td>Notice new devices on your Wi-Fi</td><td><Pill tone="info">Home sensor + your permission</Pill></td></tr>
              <tr><td>Check router settings, block websites, family schedules</td><td><Pill tone="neutral">Compatible router (not available yet)</Pill></td></tr>
            </tbody></table></div>
            <p className="muted">{needsSensor ? 'For your goal, the sensor is the key piece. It takes about 5 minutes. You can also skip it and set it up later.' : 'You can do your goal right away in your browser. The sensor is optional.'}</p>
            <div className="row"><Button onClick={() => setStep(needsSensor ? 2 : 5)}>{needsSensor ? 'Set up the sensor' : 'Go to my home'}</Button><Button variant="ghost" onClick={() => setStep(5)}>Skip for now</Button></div>
          </div>
        )}
        {step === 2 && (
          <div className="stack">
            <h2 style={{ fontSize: '1.3rem' }}>Install the home sensor</h2>
            <p className="muted">The sensor is a small Java program that runs on a computer at home. It only makes outgoing connections, needs no special permissions, and never changes your router or computer.</p>
            {!token ? <Button onClick={createSensor} busy={busy}>Create my sensor token</Button> : <SensorSetup token={token} demo={false} />}
            <div className="row"><Button variant="secondary" onClick={() => setStep(3)} disabled={!token}>I&apos;ve started it</Button><Button variant="ghost" onClick={() => setStep(5)}>Skip for now</Button></div>
          </div>
        )}
        {step === 3 && (
          <div className="stack">
            <h2 style={{ fontSize: '1.3rem' }}>What you&apos;re allowing</h2>
            <ul className="check-list"><li><CheckCircle2 size={18} aria-hidden="true" /><span>Internet checks (router, website lookups, a few popular sites) every minute. Always on once the sensor runs.</span></li></ul>
            <label className="check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span><strong>Also look for devices on my network</strong><br /><span className="muted">The sensor reads its computer&apos;s list of nearby devices. You choose the address range when you start it. You can turn this off anytime. Optional.</span></span></label>
            <Button onClick={saveConsent} busy={busy}>Continue</Button>
          </div>
        )}
        {step === 4 && (
          <div className="stack" aria-live="polite">
            <h2 style={{ fontSize: '1.3rem' }}>Your first check</h2>
            {!online ? <p className="row"><Loader2 className="spin-icon" size={18} aria-hidden="true" /> Waiting to hear from your sensor… This page checks every few seconds.</p>
              : !diag ? <p className="muted">Sensor connected. Collecting measurements…</p>
                : <Banner tone={diag.verdict === 'HEALTHY' ? 'ok' : 'info'} title={diag.headline}><p>{diag.verdict === 'INSUFFICIENT_EVIDENCE' ? 'Connected! We need a few more minutes of measurements before we can say anything about your internet.' : diag.explanation}</p><Pill tone={VERDICT_META[diag.verdict].tone}>{VERDICT_META[diag.verdict].label}</Pill></Banner>}
            {!online && <Banner tone="info"><p>Not connecting? Check the command was copied in full and that the computer is online. You can finish setup later from Settings.</p></Banner>}
            <Button onClick={() => setStep(5)} variant={online ? 'primary' : 'secondary'}>{online ? 'Continue' : 'Skip for now'}</Button>
          </div>
        )}
        {step === 5 && (
          <div className="stack">
            <h2 style={{ fontSize: '1.3rem' }}><CircleSlash size={0} aria-hidden="true" />You&apos;re all set</h2>
            <p className="muted">{online ? 'NetShield is now measuring your home.' : "Monitoring isn't running yet, so NetShield won't claim anything about your internet until a sensor is connected."} You can change any of this in Settings.</p>
            <Button onClick={() => nav('/app', { replace: true })}>Go to my home</Button>
          </div>
        )}
      </main>
    </div>
  );
}

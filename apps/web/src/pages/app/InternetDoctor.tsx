import { useState } from 'react';
import { CheckCircle2, CircleSlash, Loader2, RefreshCcw, Stethoscope, XCircle, HelpCircle } from 'lucide-react';
import { AlertCard } from '../../components/AlertCard';
import { Banner, Button, EmptyState, ErrorState, Loading, Pill, LinkButton } from '../../components/ui';
import { useAsync } from '../../lib/hooks';
import { useWorkspace } from '../../lib/workspace';
import { KIND_LABEL, VERDICT_META, fmtMs, timeAgo } from '../../lib/plain';
import { SCENARIO_LABELS } from '../../demo/demoWorkspace';
import type { Diagnosis, Retest, Verdict } from '../../lib/types';

const SYMPTOMS: { id: string; label: string; note: string }[] = [
  { id: 'slow', label: 'My Wi-Fi is slow', note: 'Slowness usually comes from the Wi-Fi, the router, or the provider. We check each one.' },
  { id: 'lag', label: 'My games keep lagging', note: "For games, how steady the connection is matters more than top speed. We pay attention to delays that jump around." },
  { id: 'drops', label: 'My internet disconnects', note: 'Drops can come from the router, the provider, or weak Wi-Fi. We look at all three.' },
  { id: 'sites', label: "Websites won't load", note: "If pages won't open but the connection seems up, the problem is often the lookup service that finds websites." },
  { id: 'calls', label: 'Video calls keep freezing', note: 'Calls freeze when the connection is uneven, even if speed tests look fine. We check how steady it is.' },
  { id: 'unsure', label: "I'm not sure", note: "No problem. We'll run the checks and tell you what we find." },
];

export function InternetDoctor() {
  const ws = useWorkspace();
  const sensors = useAsync(() => ws.getSensors(), [ws]);
  const history = useAsync(() => ws.getHistory(), [ws]);
  const [symptom, setSymptom] = useState<string | null>(null);
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [incident, setIncident] = useState<string | null>(null);
  const [retest, setRetest] = useState<Retest | null>(null);
  const [fixing, setFixing] = useState(false);

  async function run(s: string) {
    setSymptom(s); setBusy(true); setErr(null); setRetest(null); setIncident(null); setFixing(false);
    try { setDiag(await ws.getDiagnosis()); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setBusy(false); }
  }
  async function startFix() {
    setBusy(true); setErr(null);
    try { const d = await ws.recordDiagnosis(); setIncident(d.incidentId ?? null); setFixing(true); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setBusy(false); }
  }
  async function doRetest() {
    if (!incident) return;
    setBusy(true); setErr(null);
    try { const r = await ws.retest(incident); setRetest(r); setDiag(r.after); history.reload(); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setBusy(false); }
  }

  if (sensors.loading) return <Loading />;
  if (sensors.error || !sensors.data) return <ErrorState message={sensors.error ?? ''} onRetry={sensors.reload} />;
  const hasSensor = sensors.data.sensors.some((s) => s.status === 'ONLINE' || s.status === 'OFFLINE' || s.status === 'WAITING_TO_PAIR');
  const note = SYMPTOMS.find((s) => s.id === symptom)?.note;

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Internet Doctor</h1>
        <p className="muted">Tell us what&apos;s wrong. We&apos;ll check, explain it simply, help you fix it, and then confirm whether the fix worked.</p>
      </div>

      {ws.mode === 'demo' && ws.setDemoScenario && (
        <div className="card card-flat">
          <h3 style={{ fontSize: '1.05rem' }}>Demo: pick a made-up situation</h3>
          <p className="faint">These are scripted scenarios so you can see every kind of result. Real results come only from a home sensor.</p>
          <div className="chips" role="group" aria-label="Demo scenarios">
            {(Object.keys(SCENARIO_LABELS) as Verdict[]).map((v) => (
              <button key={v} type="button" className="chip" aria-pressed={ws.demoScenario === v}
                onClick={() => { ws.setDemoScenario!(v); if (symptom) void run(symptom); else setDiag(null); }}>{SCENARIO_LABELS[v]}</button>
            ))}
          </div>
        </div>
      )}

      {ws.mode === 'live' && !hasSensor && (
        <EmptyState icon={CircleSlash} title="Internet Doctor needs a home sensor"
          action={<LinkButton to={`${ws.basePath}/settings`}>Set up a sensor</LinkButton>}>
          <p>A website can&apos;t look inside your home network. The sensor is a small program on a computer at home that measures your router, website lookups and the wider internet. Without it, we can&apos;t honestly tell you what&apos;s wrong.</p>
        </EmptyState>
      )}

      {(ws.mode === 'demo' || hasSensor) && (
        <section className="card" aria-labelledby="q-h">
          <h2 id="q-h" style={{ fontSize: '1.3rem' }}>What&apos;s going on?</h2>
          <div className="chips" role="group" aria-label="Problem">
            {SYMPTOMS.map((s) => <button key={s.id} type="button" className="chip" aria-pressed={symptom === s.id} onClick={() => run(s.id)} disabled={busy}>{s.label}</button>)}
          </div>
        </section>
      )}

      {err && <ErrorState message={err} />}
      <div aria-live="polite">
        {busy && <p className="row"><Loader2 className="spin-icon" size={18} aria-hidden="true" /> Checking the latest measurements…</p>}
      </div>

      {diag && !busy && (
        <section className="stack" aria-label="Result">
          {note && <p className="muted">{note}</p>}
          <Result d={diag} mode={ws.mode} onStart={startFix} fixing={fixing} />
          {fixing && incident && !retest && (
            <div className="card">
              <h3>Try this, then check again</h3>
              <ol>
                <li>{diag.action}</li>
                <li>Give it about two minutes.</li>
                <li>Press &ldquo;Check if it worked&rdquo;. We&apos;ll take fresh measurements and compare them with what we saw before.</li>
              </ol>
              <Button icon={RefreshCcw} onClick={doRetest} busy={busy}>Check if it worked</Button>
            </div>
          )}
          {retest && <RetestCard r={retest} mode={ws.mode} />}
        </section>
      )}

      {!diag && !busy && (ws.mode === 'demo' || hasSensor) && (
        <p className="faint">Pick what&apos;s happening above and we&apos;ll look. Results use only measurements from the last 15 minutes.</p>
      )}

      <section aria-labelledby="hist-h">
        <h2 id="hist-h" style={{ fontSize: '1.3rem' }}>Past checks</h2>
        {history.loading ? <Loading /> : history.data && history.data.length ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {history.data.map((h) => (
              <li key={h.id} className="card card-flat row-between" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <span>{h.summary}</span>
                <span className="row"><Pill tone={VERDICT_META[h.verdict].tone}>{VERDICT_META[h.verdict].label}</Pill><span className="faint">{timeAgo(h.created_at)}</span></span>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No saved checks yet. A check is saved when you choose &ldquo;Help me fix this&rdquo;.</p>}
      </section>
    </div>
  );
}

function Result({ d, mode, onStart, fixing }: { d: Diagnosis; mode: string; onStart: () => void; fixing: boolean }) {
  const m = VERDICT_META[d.verdict];
  const problem = d.verdict !== 'HEALTHY' && d.verdict !== 'INSUFFICIENT_EVIDENCE';
  const sev = m.tone === 'danger' ? 'HIGH' : m.tone === 'warn' ? 'MEDIUM' : 'INFO';
  return (
    <AlertCard severity={d.verdict === 'HEALTHY' ? 'INFO' : sev} title={d.headline}
      what={d.explanation}
      why={problem ? 'Until this is sorted, you may notice pages not loading, calls freezing or games lagging.' : undefined}
      todo={d.action}
      verify={problem ? 'After you try the fix, we take fresh measurements and compare. If nothing improved, we say so.' : undefined}
      status={<Pill tone={d.confidence === 'HIGH' ? 'ok' : d.confidence === 'MEDIUM' ? 'info' : 'neutral'} icon={HelpCircle}>{d.confidence === 'LOW' ? 'Low' : d.confidence === 'MEDIUM' ? 'Fairly' : 'Very'} confident</Pill>}
      evidence={`${d.sampleCount} checks between ${new Date(d.windowStart).toLocaleTimeString()} and ${new Date(d.windowEnd).toLocaleTimeString()}${mode === 'demo' ? ' (synthetic)' : ''}.`}
      actions={problem && !fixing ? <Button onClick={onStart} icon={Stethoscope}>Help me fix this</Button> : undefined}
      tech={(
        <div className="stack">
          <p><strong>Rule:</strong> {m.technical}</p>
          <div className="table-wrap"><table>
            <thead><tr><th>Checked</th><th>Samples</th><th>Failed</th><th>Typical delay</th><th>Delay variation</th></tr></thead>
            <tbody>{Object.entries(d.evidence).map(([k, s]) => (
              <tr key={k}><td>{KIND_LABEL[k] ?? k} <span className="faint">({k})</span></td><td>{s.count}</td><td>{s.lossPct.toFixed(0)}%</td><td>{fmtMs(s.medianMs)}</td><td>{fmtMs(s.jitterMs)}</td></tr>
            ))}</tbody></table></div>
          <p className="faint">Source: {d.source === 'DEMO_SYNTHETIC' ? 'synthetic demo scenario' : 'measurements uploaded by your home sensor'}. Gateway checks use a TCP connection to your router because ICMP ping needs elevated privileges.</p>
        </div>
      )} />
  );
}

function RetestCard({ r, mode }: { r: Retest; mode: string }) {
  const ok = r.outcome === 'VERIFIED';
  const inc = r.outcome === 'INCONCLUSIVE';
  const Icon = ok ? CheckCircle2 : inc ? HelpCircle : XCircle;
  return (
    <Banner tone={ok ? 'ok' : inc ? 'info' : 'warn'} title={ok ? 'Confirmed: it looks fixed' : inc ? "We can't tell yet" : "It doesn't look fixed yet"} role="status">
      <p><Icon size={16} aria-hidden="true" style={{ verticalAlign: '-3px' }} /> {r.detail}</p>
      <p className="faint">Before: {VERDICT_META[r.beforeVerdict].label} → Now: {VERDICT_META[r.afterVerdict].label}.{mode === 'demo' && ' (Scripted demo result.)'}</p>
    </Banner>
  );
}

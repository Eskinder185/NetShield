import { useState } from 'react';
import { ListChecks, ShieldCheck } from 'lucide-react';
import { AlertCard } from '../../components/AlertCard';
import { Banner, Button, EmptyState, ErrorState, Loading, Pill } from '../../components/ui';
import { useAsync } from '../../lib/hooks';
import { useWorkspace } from '../../lib/workspace';
import { SEVERITY, timeAgo } from '../../lib/plain';
import type { CoverageState, FindingStatus } from '../../lib/types';

const COVERAGE_STATE: Record<CoverageState, { label: string; tone: 'ok' | 'info' | 'warn' | 'neutral' }> = {
  PROTECTION_VERIFIED_ACTIVE: { label: 'Protection verified active', tone: 'ok' },
  MONITORING_AVAILABLE: { label: 'Monitoring available', tone: 'info' },
  ACTION_REQUIRED: { label: 'Action required', tone: 'warn' },
  NOT_CONFIGURED: { label: 'Not configured', tone: 'neutral' },
  UNSUPPORTED: { label: 'Unsupported', tone: 'neutral' },
  STATUS_UNKNOWN: { label: 'Status unknown', tone: 'neutral' },
  TEMPORARILY_UNAVAILABLE: { label: 'Temporarily unavailable', tone: 'warn' },
};

export function Protection() {
  const ws = useWorkspace();
  const findings = useAsync(() => ws.getFindings(), [ws]);
  const prot = useAsync(() => ws.getProtection(), [ws]);
  const coverage = useAsync(() => ws.getCoverage(), [ws]);
  const devices = useAsync(() => ws.getDevices(), [ws]);
  const [tab, setTab] = useState<'open' | 'all'>('open');
  const [selectedLayer, setSelectedLayer] = useState('diagnostics');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function setStatus(id: string, s: FindingStatus) {
    setErr(null);
    try { await ws.setFinding(id, s); findings.reload(); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
  }
  async function mark(key: string, done: boolean) {
    setErr(null);
    try { await ws.markProtection(key, done); prot.reload(); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); }
  }

  const list = (findings.data ?? []).filter((f) => tab === 'all' || f.status !== 'RESOLVED');
  const layer = coverage.data?.layers.find((item) => item.key === selectedLayer) ?? coverage.data?.layers[0];
  const device = devices.data?.devices.find((item) => item.id === selectedDevice);
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Protection</h1>
        <p className="muted">Things worth your attention, in order of importance, with the evidence behind each one.</p>
      </div>
      {err && <ErrorState message={err} />}

      <section aria-labelledby="coverage-h" className="stack">
        <div>
          <h2 id="coverage-h" style={{ fontSize: '1.4rem' }}>Your coverage map</h2>
          <p className="muted">See what NetShield can observe, what it cannot see, and what needs setup. Monitoring does not mean protection is active.</p>
        </div>
        {coverage.loading ? <Loading label="Assessing coverage" /> : coverage.error ? <ErrorState message={coverage.error} onRetry={coverage.reload} /> : coverage.data && layer && <>
          <div className="grid grid-3 coverage-grid" aria-label="Protection layers">
            {coverage.data.layers.map((item) => <button key={item.key} type="button"
              className="card coverage-choice" aria-pressed={layer.key === item.key} onClick={() => { setSelectedLayer(item.key); setSelectedDevice(null); }}>
              <strong>{item.title}</strong><Pill tone={COVERAGE_STATE[item.state].tone}>{COVERAGE_STATE[item.state].label}</Pill>
              <span className="faint">{item.lastObservedAt ? `Last observed ${timeAgo(item.lastObservedAt)}` : 'No observation available'}</span>
            </button>)}
          </div>
          <div className="card stack" aria-live="polite">
            <div className="row-between"><h3 style={{ margin: 0 }}>{layer.title}</h3><Pill tone={COVERAGE_STATE[layer.state].tone}>{COVERAGE_STATE[layer.state].label}</Pill></div>
            <p><strong>What we know:</strong> {layer.known}</p>
            <p><strong>What we cannot see:</strong> {layer.blindSpot}</p>
            <p><strong>Next step:</strong> {layer.nextStep}</p>
            <p className="faint">{layer.lastObservedAt ? `Last observed ${new Date(layer.lastObservedAt).toLocaleString()}` : 'No successful observation recorded'} · Assessed {new Date(coverage.data.assessedAt).toLocaleString()}{ws.mode === 'demo' ? ' (synthetic demo)' : ''}.</p>
            {layer.key === 'devices' && (devices.loading ? <Loading label="Loading devices" /> : devices.error ? <ErrorState message={devices.error} onRetry={devices.reload} /> : devices.data && <>
              <h4>Observed devices</h4>
              {!devices.data.consented ? <p className="muted">Device inventory is off. You can enable it in Settings.</p> : devices.data.devices.length === 0 ? <p className="muted">No devices have been observed yet. This does not mean the network is empty.</p> : <>
                <div className="chips" role="group" aria-label="Observed devices">
                  {devices.data.devices.map((d) => <button key={d.id} type="button" className="chip" aria-pressed={d.id === selectedDevice} onClick={() => setSelectedDevice(d.id)}>{d.display_name || d.hostname || 'Unnamed device'}</button>)}
                </div>
                {device && <div className="card card-flat"><h4>{device.display_name || device.hostname || 'Unnamed device'}</h4>
                  <p>Marked {device.trust.toLowerCase()} by your household. Last observed {timeAgo(device.last_seen_at)}.</p>
                  <p className="muted">NetShield cannot verify this device&apos;s firmware, malware status, or all its traffic.</p></div>}
              </>}
            </>)}
          </div>
        </>}
      </section>

      <section aria-labelledby="f-h" className="stack">
        <div className="row-between">
          <h2 id="f-h" style={{ fontSize: '1.4rem' }}>Alerts</h2>
          <div className="tabs" role="tablist" aria-label="Alert filter" style={{ margin: 0, border: 0 }}>
            <button role="tab" className="tab" aria-selected={tab === 'open'} onClick={() => setTab('open')}>Needs a look</button>
            <button role="tab" className="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>Everything</button>
          </div>
        </div>
        {findings.loading ? <Loading /> : findings.error ? <ErrorState message={findings.error} onRetry={findings.reload} /> : list.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No alerts right now">
            <p>That only reflects what NetShield can see: new devices a consented sensor reports, and internet checks. It doesn&apos;t mean every setting is safe, so check the list below.</p>
          </EmptyState>
        ) : list.map((f) => (
          <AlertCard key={f.id} severity={f.severity} title={f.title}
            status={<Pill tone={f.status === 'RESOLVED' ? 'ok' : f.status === 'ACKNOWLEDGED' ? 'neutral' : 'warn'}>{f.status === 'RESOLVED' ? 'Closed' : f.status === 'ACKNOWLEDGED' ? 'Reviewed' : 'Open'}</Pill>}
            what="A device we haven't seen before joined your network."
            why="An unfamiliar device could be a guest's phone, or someone using your Wi-Fi without permission."
            todo={f.recommendation}
            verify="When you mark the device as known or guest on My Devices, this alert closes. If you reopen it, we'll flag it again."
            evidence={`${f.evidence} (confidence: ${f.confidence.toLowerCase()}).`}
            actions={<>
              {f.status === 'OPEN' && <Button size="sm" variant="secondary" onClick={() => setStatus(f.id, 'ACKNOWLEDGED')}>I&apos;ve looked at this</Button>}
              {f.status !== 'RESOLVED' && <Button size="sm" variant="secondary" onClick={() => setStatus(f.id, 'RESOLVED')}>Close this alert</Button>}
              {f.status === 'RESOLVED' && <Button size="sm" variant="secondary" onClick={() => setStatus(f.id, 'OPEN')}>Reopen</Button>}
            </>}
            tech={<p style={{ marginBottom: 0 }}>Category <code>{f.category}</code> · severity {f.severity} · created {timeAgo(f.created_at)} · updated {timeAgo(f.updated_at)}</p>} />
        ))}
      </section>

      <section aria-labelledby="c-h" className="stack">
        <h2 id="c-h" style={{ fontSize: '1.4rem' }}>Home security checklist</h2>
        <Banner tone="info" title="“Done” means you say it's done">
          <p>NetShield can&apos;t see your router&apos;s settings yet, so it can&apos;t confirm any of these. Ticking a box records your own report. It never counts as verified.</p>
        </Banner>
        {prot.loading ? <Loading /> : prot.error ? <ErrorState message={prot.error} onRetry={prot.reload} /> : prot.data && (
          <>
            <p><strong>{prot.data.verifiedCount} of {prot.data.total}</strong> confirmed by NetShield · <strong>{prot.data.items.filter((i) => i.selfReportedDone).length}</strong> marked done by you</p>
            <div className="stack">
              {prot.data.items.map((i) => (
                <div key={i.key} className="card">
                  <div className="row-between">
                    <label className="check" style={{ flex: 1 }}>
                      <input type="checkbox" checked={i.selfReportedDone} onChange={(e) => mark(i.key, e.target.checked)} />
                      <span><strong>{i.title}</strong><br /><span className="muted">{i.why}</span></span>
                    </label>
                    <div className="row">
                      <Pill tone={SEVERITY[i.severity].tone}>{SEVERITY[i.severity].label}</Pill>
                      <Pill tone={i.verified ? 'ok' : i.selfReportedDone ? 'info' : 'neutral'} icon={ListChecks}>{i.verified ? 'Verified' : i.selfReportedDone ? 'You say done' : 'Not confirmed'}</Pill>
                    </div>
                  </div>
                  <p style={{ margin: '12px 0 0 34px' }}><strong>How:</strong> {i.how}</p>
                  <p className="faint" style={{ margin: '4px 0 0 34px' }}>{i.verificationNote}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

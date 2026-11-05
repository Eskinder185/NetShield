import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleSlash, Laptop, MessageCircle, ShieldCheck, ShieldAlert, Stethoscope, WifiOff, AlertTriangle, Radio } from 'lucide-react';
import { Banner, ErrorState, Loading, Pill, LinkButton } from '../../components/ui';
import { AlertCard } from '../../components/AlertCard';
import { useAsync } from '../../lib/hooks';
import { useWorkspace } from '../../lib/workspace';
import { SENSOR_META, VERDICT_META, timeAgo } from '../../lib/plain';

export function Dashboard() {
  const ws = useWorkspace();
  const state = useAsync(async () => {
    const [sensors, diagnosis, findings, devices, protection] = await Promise.all([
      ws.getSensors(), ws.getDiagnosis(), ws.getFindings(), ws.getDevices(), ws.getProtection(),
    ]);
    return { sensors, diagnosis, findings, devices, protection };
  }, [ws]);

  if (state.loading) return <Loading label="Checking on your home" />;
  if (state.error || !state.data) return <ErrorState message={state.error ?? 'Unknown error'} onRetry={state.reload} />;
  const { sensors, diagnosis, findings, devices, protection } = state.data;

  const hasSensor = sensors.sensors.some((s) => s.status !== 'REVOKED' && s.status !== 'EXPIRED');
  const online = sensors.anyOnline;
  const open = findings.filter((f) => f.status === 'OPEN');
  const unconfirmed = protection.items.filter((i) => !i.verified);
  const unknownDevices = devices.devices.filter((d) => d.trust === 'UNKNOWN').length;
  const vm = VERDICT_META[diagnosis.verdict];

  // Headline: honest first. Without a live sensor we say so; we never imply "protected".
  let internetLine: string, tone: 'ok' | 'warn' | 'danger' | 'neutral', Icon = CheckCircle2;
  if (!online) {
    tone = 'neutral'; Icon = hasSensor ? WifiOff : CircleSlash;
    internetLine = hasSensor ? "We can't see your internet right now because your sensor is offline." : "Monitoring isn't set up yet, so we can't tell how your internet is doing.";
  } else if (diagnosis.verdict === 'INSUFFICIENT_EVIDENCE') {
    tone = 'neutral'; Icon = Radio; internetLine = "We're still collecting enough measurements to judge your internet.";
  } else if (diagnosis.verdict === 'HEALTHY') {
    tone = 'ok'; internetLine = 'Your internet is working normally.';
  } else { tone = vm.tone === 'warn' ? 'warn' : 'danger'; Icon = AlertTriangle; internetLine = diagnosis.headline; }

  const attention = open.length + (unknownDevices && !open.length ? 0 : 0);
  const secLine = attention > 0
    ? `${attention} ${attention === 1 ? 'thing needs' : 'things need'} your attention.`
    : `${unconfirmed.length} recommended ${unconfirmed.length === 1 ? 'setting is' : 'settings are'} not confirmed yet.`;

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Your home</h1>
        <p className="muted">A quick look at how things are right now.</p>
      </div>

      <section className="status-hero" aria-labelledby="hero-h">
        <div className={`big-icon ${tone}`}><Icon size={32} aria-hidden="true" /></div>
        <div>
          <h2 id="hero-h">{internetLine} {secLine}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {ws.mode === 'demo' ? 'Based on synthetic demo data. ' : online ? `Based on live measurements, updated ${timeAgo(diagnosis.windowEnd)}. ` : ''}
            {!online && ws.mode === 'live' && <>No live measurements: <Link to={`${ws.basePath}/settings`}>set up a sensor</Link> for real results.</>}
          </p>
        </div>
      </section>

      <div className="card card-flat row-between">
        <div><strong>Worried about a message or a mistake?</strong><p className="muted" style={{ margin: 0 }}>Get calm, step-by-step recovery guidance.</p></div>
        <LinkButton to={`${ws.basePath}/scam-shield`} icon={ShieldAlert} variant="secondary">I think I got scammed</LinkButton>
      </div>

      {!hasSensor && ws.mode === 'live' && (
        <Banner tone="info" title="Monitoring isn't configured">
          <p>A browser alone can&apos;t see your home network. NetShield&apos;s small home sensor runs on a computer at home and checks your internet from the inside. Until it&apos;s running, nothing on this page is a live measurement.</p>
          <LinkButton to={`${ws.basePath}/settings`} size="sm" variant="secondary">Set up a sensor</LinkButton>
        </Banner>
      )}

      <div className="grid grid-4">
        <div className="card tile"><span className="tile-label"><Stethoscope size={16} aria-hidden="true" />Internet</span>
          <span className="tile-value">{online ? vm.label : 'Not measured'}</span>
          {ws.mode === 'demo' ? <Pill tone="demo">Demo data</Pill> : <Pill tone={online ? vm.tone : 'neutral'}>{online ? 'Live measurement' : 'No live data'}</Pill>}</div>
        <div className="card tile"><span className="tile-label"><Laptop size={16} aria-hidden="true" />Devices</span>
          <span className="tile-value">{devices.devices.length} seen</span>
          <span className={unknownDevices ? 'pill pill-warn' : 'faint'}>{unknownDevices ? `${unknownDevices} not yet identified` : devices.consented ? 'All identified' : 'Device checking is off'}</span></div>
        <div className="card tile"><span className="tile-label"><ShieldCheck size={16} aria-hidden="true" />Protection</span>
          <span className="tile-value">{protection.verifiedCount} of {protection.total} confirmed</span>
          <span className="faint">{protection.items.filter((i) => i.selfReportedDone).length} marked done by you</span></div>
        <div className="card tile"><span className="tile-label"><Radio size={16} aria-hidden="true" />Home sensor</span>
          <span className="tile-value">{sensors.sensors[0] ? SENSOR_META[sensors.sensors[0].status].label : 'None'}</span>
          <span className="faint">{sensors.sensors[0] ? `Last heard ${timeAgo(sensors.sensors[0].lastHeartbeatAt)}` : 'Needed for live checks'}</span></div>
      </div>

      <section aria-labelledby="next-h" className="stack">
        <h2 id="next-h" style={{ fontSize: '1.4rem' }}>What to do next</h2>
        {online && diagnosis.verdict !== 'HEALTHY' && diagnosis.verdict !== 'INSUFFICIENT_EVIDENCE' && (
          <AlertCard severity="HIGH" title={diagnosis.headline} what={diagnosis.explanation} todo={diagnosis.action}
            verify="We'll run the checks again and compare the results. We only say it's fixed if the new measurements show it."
            actions={<LinkButton to={`${ws.basePath}/internet-doctor`} icon={Stethoscope}>Help me fix this</LinkButton>} />
        )}
        {open.length > 0 && (
          <AlertCard severity={open.some((f) => f.severity === 'HIGH') ? 'HIGH' : 'MEDIUM'}
            title={open.length === 1 ? open[0].title : `${open.length} devices we don't recognize appeared on your network`}
            what={open.length === 1 ? "A device we haven't seen before joined your network." : `${open.length} devices we haven't seen before joined your network.`}
            why="If you don't recognize them, someone you don't know could be using your Wi-Fi."
            todo={open[0].recommendation} verify="Once you tell us what each one is, we'll stop flagging it."
            actions={<LinkButton to={`${ws.basePath}/devices`} icon={Laptop} variant="secondary">{open.length === 1 ? 'Help me identify it' : 'Help me identify them'}</LinkButton>} />
        )}
        {!open.length && !(online && diagnosis.verdict !== 'HEALTHY' && diagnosis.verdict !== 'INSUFFICIENT_EVIDENCE') && (
          <div className="card">
            <p style={{ marginBottom: 8 }}><strong>Nothing urgent from what NetShield can see.</strong></p>
            <p className="muted" style={{ marginBottom: 12 }}>That only covers what&apos;s measured. {unconfirmed.length} recommended router and account settings aren&apos;t confirmed yet.</p>
            <LinkButton to={`${ws.basePath}/protection`} variant="secondary" size="sm" icon={ShieldCheck}>Review the checklist</LinkButton>
          </div>
        )}
      </section>

      <div className="grid grid-2">
        <div className="card">
          <h3>Ask NetShield</h3>
          <p className="muted">Describe what&apos;s wrong in your own words, like &ldquo;my video calls keep freezing&rdquo;, and get a plain answer based on your latest checks.</p>
          <div className="row">
            <LinkButton to={`${ws.basePath}/internet-doctor`} icon={Stethoscope}>Start Internet Doctor</LinkButton>
            <LinkButton to={`${ws.basePath}/assistant`} variant="secondary" icon={MessageCircle}>Ask the assistant</LinkButton>
          </div>
        </div>
        <div className="card">
          <h3>What NetShield can see</h3>
          <ul className="check-list" style={{ marginBottom: 0 }}>
            <li><CheckCircle2 size={18} aria-hidden="true" /><span>Internet speed-of-response and website lookups, <strong>with a home sensor</strong></span></li>
            <li><CheckCircle2 size={18} aria-hidden="true" /><span>Devices that talk to the sensor&apos;s computer, <strong>only if you allow it</strong></span></li>
            <li><CircleSlash size={18} aria-hidden="true" style={{ color: 'var(--text-faint)' }} /><span>Router settings and every device on every network: <strong>not yet</strong></span></li>
          </ul>
          <Link to={`${ws.basePath}/privacy`} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginTop: 12 }}>See exactly what&apos;s collected <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  );
}

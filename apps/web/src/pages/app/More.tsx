import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Lock, Printer, Send, ShieldOff, Users, Trash2, Copy, KeyRound, Info } from 'lucide-react';
import { Banner, Button, Dialog, Disclosure, EmptyState, ErrorState, Field, LinkButton, Loading, Pill, TechDetails } from '../../components/ui';
import { useAsync, useAuth, useTheme } from '../../lib/hooks';
import { useWorkspace } from '../../lib/workspace';
import { SENSOR_META, VERDICT_META, timeAgo } from '../../lib/plain';
import { api } from '../../lib/api';
import type { Diagnosis } from '../../lib/types';

/* ====================== Family ====================== */
export function Family() {
  const ws = useWorkspace();
  const devices = useAsync(() => ws.getDevices(), [ws]);
  if (devices.loading) return <Loading />;
  if (devices.error || !devices.data) return <ErrorState message={devices.error ?? ''} onRetry={devices.reload} />;
  const byOwner = new Map<string, string[]>();
  devices.data.devices.forEach((d) => {
    const k = d.owner || 'Not assigned';
    byOwner.set(k, [...(byOwner.get(k) ?? []), d.display_name ?? d.hostname ?? 'Unnamed device']);
  });
  return (
    <div className="stack">
      <div><h1 className="page-title">Family</h1>
        <p className="muted">See whose devices are whose. Family controls like bedtime schedules and content filters need a compatible router, and aren&apos;t available yet.</p></div>
      <section className="card stack" aria-labelledby="who-h">
        <h2 id="who-h" style={{ fontSize: '1.3rem' }}>Devices by person</h2>
        {byOwner.size === 0 ? <EmptyState icon={Users} title="No devices to group yet"><p>Name the owner when you identify a device on My Devices, and it will show up here.</p></EmptyState> : (
          <div className="grid grid-3">{[...byOwner.entries()].map(([o, l]) => (
            <div key={o} className="card card-flat"><h3>{o}</h3><ul style={{ marginBottom: 0 }}>{l.map((n) => <li key={n}>{n}</li>)}</ul></div>
          ))}</div>
        )}
        <LinkButton to={`${ws.basePath}/devices`} variant="secondary" size="sm">Assign devices</LinkButton>
      </section>
      <section className="card stack" aria-labelledby="ctl-h">
        <h2 id="ctl-h" style={{ fontSize: '1.3rem' }}>Family controls</h2>
        <Banner tone="info" title="Not available yet" ><p>Blocking categories, safe search and pause schedules work by changing what your router or DNS service allows. NetShield doesn&apos;t have a connection to a compatible router, so these controls are switched off rather than pretending to work.</p></Banner>
        {['Block categories of websites', 'Bedtime and homework schedules', 'Pause the internet for a device'].map((t) => (
          <label key={t} className="check" style={{ opacity: 0.6 }}><input type="checkbox" disabled /><span>{t} <Pill tone="neutral" icon={ShieldOff}>Needs a compatible router</Pill></span></label>
        ))}
        <p className="faint">What you will always be told: what each control does, who it affects and why, in words a child could understand.</p>
      </section>
    </div>
  );
}

/* ====================== Privacy & VPN ====================== */
export function PrivacyVpn() {
  const ws = useWorkspace();
  return (
    <div className="stack">
      <div><h1 className="page-title">Privacy &amp; VPN</h1><p className="muted">Exactly what NetShield collects, how long it keeps it, and what a VPN does and doesn&apos;t do.</p></div>
      <section className="card" aria-labelledby="coll-h">
        <h2 id="coll-h" style={{ fontSize: '1.3rem' }}>What&apos;s collected</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>What</th><th>Why</th><th>When</th></tr></thead>
          <tbody>
            <tr><td>Router, website-lookup and website response times</td><td>To work out why your internet is slow</td><td>Always, once a sensor is running. Kept {ws.settings.retentionDays} days.</td></tr>
            <tr><td>Devices seen on your network (a one-way fingerprint of the hardware address, address on your network, name)</td><td>To spot devices you don&apos;t recognize</td><td>Only if you turn on device checking. Currently <strong>{ws.settings.consentDeviceInventory ? 'on' : 'off'}</strong>.</td></tr>
            <tr><td>Your account (email, name, hashed password)</td><td>To sign you in</td><td>Until you delete your account</td></tr>
            <tr><td>Websites you visit, message contents, traffic</td><td>n/a</td><td><strong>Never collected.</strong> NetShield doesn&apos;t capture traffic.</td></tr>
          </tbody></table></div>
        <p className="faint" style={{ marginTop: 12 }}>Links you paste into Scam Shield are read as text and not stored. No data is sent to AI or advertising services.</p>
        <div className="row"><LinkButton to={`${ws.basePath}/settings`} size="sm" variant="secondary">Change retention &amp; consent</LinkButton><LinkButton to={`${ws.basePath}/reports`} size="sm" variant="secondary" icon={Download}>Export my data</LinkButton></div>
      </section>
      <section className="card stack" aria-labelledby="vpn-h">
        <div className="row-between"><h2 id="vpn-h" style={{ fontSize: '1.3rem', margin: 0 }}>VPN</h2><Pill tone="neutral" icon={Lock}>Not set up · needs your own VPN server</Pill></div>
        <Banner tone="info" title="NetShield doesn't provide a VPN service"><p>There is no NetShield VPN tunnel or exit server. This page explains the idea and, in the future, will help you connect to a WireGuard server you run at home.</p></Banner>
        <div className="grid grid-2">
          <div><h3>A VPN can</h3><ul className="check-list"><li><Lock size={16} aria-hidden="true" /><span>Hide your activity from the Wi-Fi network you&apos;re on, like a café</span></li><li><Lock size={16} aria-hidden="true" /><span>Let you reach your home network safely while away</span></li></ul></div>
          <div><h3>A VPN can&apos;t</h3><ul className="check-list no"><li><ShieldOff size={16} aria-hidden="true" /><span>Make you anonymous. The VPN operator can see your activity</span></li><li><ShieldOff size={16} aria-hidden="true" /><span>Stop phishing or malware, or replace secure (https) sites and device updates</span></li></ul></div>
        </div>
        <Disclosure title="Setup requirements for a home WireGuard connection"><ol><li>A router or small computer at home running WireGuard</li><li>A way to reach it from outside (a forwarded port or a relay), which exposes a service to the internet, so only do this deliberately</li><li>A WireGuard app on each device</li></ol><p style={{ marginBottom: 0 }}>NetShield won&apos;t change your router for you. Guided setup is on the roadmap.</p></Disclosure>
      </section>
    </div>
  );
}

/* ====================== Reports ====================== */
export function Reports() {
  const ws = useWorkspace();
  const hist = useAsync(() => ws.getHistory(), [ws]);
  const diag = useAsync<Diagnosis>(() => ws.getDiagnosis(), [ws]);
  const find = useAsync(() => ws.getFindings(), [ws]);
  return (
    <div className="stack">
      <div className="row-between no-print"><div><h1 className="page-title">Reports</h1><p className="muted">A summary of what happened, what was fixed and what still needs attention.</p></div>
        <Button icon={Printer} variant="secondary" onClick={() => window.print()}>Print or save as PDF</Button></div>
      <article className="card stack" aria-label="Report">
        <div className="row-between"><h2 style={{ fontSize: '1.4rem', margin: 0 }}>{ws.siteName}: status summary</h2>
          {ws.mode === 'demo' ? <Pill tone="demo">Demo · synthetic data</Pill> : <Pill tone="info">Generated {new Date().toLocaleString()}</Pill>}</div>
        {diag.loading ? <Loading /> : diag.data && <>
          <h3>Internet right now</h3>
          <p><Pill tone={VERDICT_META[diag.data.verdict].tone}>{VERDICT_META[diag.data.verdict].label}</Pill> {diag.data.headline}</p>
          <p className="muted">{diag.data.explanation}</p>
          <p className="faint">Based on {diag.data.sampleCount} checks from {new Date(diag.data.windowStart).toLocaleString()} to {new Date(diag.data.windowEnd).toLocaleString()}. {diag.data.source === 'DEMO_SYNTHETIC' ? 'Synthetic demo data.' : 'Measured by your home sensor.'}</p></>}
        <h3>Past internet checks</h3>
        {hist.loading ? <Loading /> : hist.data?.length ? <ul>{hist.data.map((h) => <li key={h.id}>{new Date(h.created_at).toLocaleString()}: {h.summary} ({VERDICT_META[h.verdict].label})</li>)}</ul> : <p className="muted">None saved yet.</p>}
        <h3>Alerts</h3>
        {find.loading ? <Loading /> : find.data?.length ? <ul>{find.data.map((f) => <li key={f.id}>{f.title}: {f.status === 'RESOLVED' ? 'closed' : f.status === 'ACKNOWLEDGED' ? 'reviewed' : 'open'}</li>)}</ul> : <p className="muted">No alerts.</p>}
        <p className="faint">Limits: measurements describe only the times your sensor was running and the targets it was told to check. A report is evidence for a conversation with your provider, not a guarantee.</p>
      </article>
      <section className="card stack no-print" aria-labelledby="dl-h">
        <h2 id="dl-h" style={{ fontSize: '1.3rem' }}>Download your data</h2>
        {ws.mode === 'demo' ? <Banner tone="demo"><p>Downloads are turned off in the demo because there&apos;s no real data to export.</p></Banner> : (
          <div className="row"><a className="btn btn-secondary" href={ws.exportJsonUrl} download><Download size={18} aria-hidden="true" />Everything (JSON)</a>
            <a className="btn btn-secondary" href={ws.exportCsvUrl} download><Download size={18} aria-hidden="true" />Measurements (CSV)</a></div>)}
      </section>
    </div>
  );
}

/* ====================== Assistant (rules-based, no AI) ====================== */
type Msg = { who: 'me' | 'bot'; text: string };
export function Assistant() {
  const ws = useWorkspace();
  const [msgs, setMsgs] = useState<Msg[]>([{ who: 'bot', text: "Hi! I'm a simple helper that answers using your latest checks. I'm not an AI, and I can't change anything on your network. What's going on?" }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  async function ask(q: string) {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { who: 'me', text: q }]); setText(''); setBusy(true);
    let a: string;
    const l = q.toLowerCase();
    try {
      if (/scam|link|phish|suspicious|text message|email/.test(l)) a = 'For a link you\'re unsure about, paste it into Scam Shield. If you already clicked one, the "I clicked a bad link" steps there are the place to start. I never open links myself.';
      else if (/device|stranger|someone|unknown|wifi password|neighbo/.test(l)) a = 'Open My Devices to see what NetShield has noticed. If something looks unfamiliar, mark it once you know what it is. If you can\'t tell, changing your Wi-Fi password disconnects anything you don\'t reconnect yourself.';
      else if (/slow|lag|freez|call|drop|disconnect|load|website|internet|wi-?fi|buffer/.test(l)) {
        const d = await ws.getDiagnosis();
        a = d.verdict === 'INSUFFICIENT_EVIDENCE' ? `${d.headline} ${d.explanation} ${d.action}` : `${d.headline} ${d.explanation} Suggested next step: ${d.action}${ws.mode === 'demo' ? ' (This answer uses synthetic demo data.)' : ''}`;
      } else a = "I can help with slow or unreliable internet, unknown devices, and suspicious links. Try one of the suggestions below, or use Internet Doctor for a guided check.";
    } catch { a = "I couldn't reach your latest checks just now. Try Internet Doctor, or try again in a moment."; }
    setMsgs((m) => [...m, { who: 'bot', text: a }]); setBusy(false);
    setTimeout(() => end.current?.scrollIntoView({ block: 'end' }), 0);
  }
  return (
    <div className="stack">
      <div><h1 className="page-title">Assistant</h1><p className="muted">Plain-English answers based on your latest checks.</p></div>
      <Banner tone="info" title="How this works"><p>This helper follows fixed rules and reads your own check results. It isn&apos;t a chatbot, it sends nothing anywhere, and it can&apos;t change settings. An optional AI helper isn&apos;t configured. <Pill tone="neutral" icon={Info}>AI: off</Pill></p></Banner>
      <div className="card chat" role="log" aria-live="polite" aria-label="Conversation">
        {msgs.map((m, i) => <div key={i} className={`bubble ${m.who}`}>{m.text}</div>)}
        {busy && <div className="bubble bot">Looking at your latest checks…</div>}
        <div ref={end} />
      </div>
      <div className="chips">{['My video calls keep freezing', 'Websites won\'t load', 'Is someone using my Wi-Fi?', 'I got a weird text with a link'].map((q) => <button key={q} type="button" className="chip" onClick={() => ask(q)}>{q}</button>)}</div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); void ask(text); }}>
        <div style={{ flex: 1, minWidth: 220 }}><label htmlFor="ask" className="sr-only">Describe your problem</label>
          <input id="ask" className="input" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} placeholder="Describe the problem in your own words…" /></div>
        <Button type="submit" icon={Send} disabled={!text.trim() || busy}>Ask</Button>
      </form>
    </div>
  );
}

/* ====================== Advanced Lab ====================== */
const GLOSSARY: [string, string, string][] = [
  ['DNS', 'The phone book of the internet: it turns a website name into the number computers use.', 'Resolver queries (A/AAAA) over UDP/TCP 53; failures show as timeouts or SERVFAIL/NXDOMAIN.'],
  ['Latency', 'How long a message takes to get an answer. Lower is snappier.', 'Round-trip time in ms. NetShield uses TCP connect time because ICMP needs privileges.'],
  ['Jitter', 'How much that delay jumps around. Calls and games hate jumpy.', 'Here: mean absolute difference between successive latency samples.'],
  ['Packet loss', 'Messages that never arrive and have to be sent again.', 'Measured as failed probes / total probes. Not equal to ICMP loss.'],
  ['Gateway', 'Your router: the door between your home and the internet.', 'The default route next hop; NetShield probes its TCP ports 80/443/53.'],
  ['VLAN', 'A way to split one network into separate private "rooms".', '802.1Q tagging; used to isolate IoT, guests and management.'],
];
export function Lab() {
  const [tab, setTab] = useState<'gloss' | 'sim' | 'adapt'>('gloss');
  return (
    <div className="stack">
      <div><h1 className="page-title">Advanced Lab</h1><p className="muted">For students and network enthusiasts. Read-only learning tools. Nothing here changes a real network.</p></div>
      <div className="tabs" role="tablist" aria-label="Lab sections">
        {([['gloss', 'Glossary'], ['sim', 'Simulations'], ['adapt', 'Lab integrations']] as const).map(([k, l]) => <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'gloss' && <div className="stack">{GLOSSARY.map(([t, b, a]) => <Disclosure key={t} title={t}><p>{b}</p><TechDetails label="advanced explanation"><p style={{ marginBottom: 0 }}>{a}</p></TechDetails></Disclosure>)}</div>}
      {tab === 'sim' && (
        <div className="stack">
          <Banner tone="demo" title="These are simulations"><p>Diagrams and descriptions of what a lab setup would look like. No router, firewall or VLAN is being contacted.</p></Banner>
          <div className="grid grid-2">
            <div className="card"><Pill tone="demo">Simulated</Pill><h3 style={{ marginTop: 10 }}>DNS outage</h3><p className="muted">A resolver stops answering while direct IPs still work. NetShield&apos;s Internet Doctor recognizes exactly this pattern (try the demo scenario).</p><Link to="/demo/internet-doctor">Open in the demo →</Link></div>
            <div className="card"><Pill tone="demo">Simulated</Pill><h3 style={{ marginTop: 10 }}>IoT on its own VLAN</h3>
              <svg viewBox="0 0 300 120" className="chart" role="img" aria-label="Diagram: router connects to three zones: trusted, IoT and guest. IoT and guest cannot reach trusted."><rect x="110" y="8" width="80" height="30" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" /><text x="150" y="28" textAnchor="middle" className="chart-text">Firewall</text>
                {[['Trusted', 20], ['IoT', 110], ['Guest', 200]].map(([n, x]) => <g key={n as string}><line x1="150" y1="38" x2={(x as number) + 40} y2="80" className="chart-axis" /><rect x={x as number} y="80" width="80" height="30" rx="8" fill="var(--surface-2)" stroke="var(--border-strong)" /><text x={(x as number) + 40} y="100" textAnchor="middle" className="chart-text">{n}</text></g>)}</svg>
              <p className="muted">IoT gadgets can reach the internet but not your laptops. Needs a router that supports VLANs.</p></div>
            <div className="card"><Pill tone="demo">Simulated</Pill><h3 style={{ marginTop: 10 }}>Routing between sites (OSPF)</h3><p className="muted">Learn how two routers share what they can reach. A future lab can show FRRouting output here.</p></div>
          </div>
        </div>
      )}
      {tab === 'adapt' && (
        <div className="table-wrap"><table><thead><tr><th>Integration</th><th>Status</th><th>What it needs</th></tr></thead><tbody>
          {[['OPNsense (read-only)', 'An isolated lab firewall and an API key you create'], ['Proxmox lab view', 'A lab host and read-only API token'], ['FRRouting', 'A lab router with vtysh access'], ['Wazuh / Suricata alerts', 'Your own Wazuh/Suricata deployment'], ['Optional AI summaries', 'A provider you choose, with your own key']].map(([n, r]) => (
            <tr key={n}><td>{n}</td><td><Pill tone="neutral">Not configured</Pill></td><td>{r}</td></tr>))}</tbody></table></div>
      )}
    </div>
  );
}

/* ====================== Settings ====================== */
export function SettingsPage() {
  const ws = useWorkspace();
  const { user } = useAuth();
  const [theme, setTheme] = useTheme();
  const sensors = useAsync(() => ws.getSensors(), [ws]);
  const [name, setName] = useState(ws.settings.name);
  const [days, setDays] = useState(ws.settings.retentionDays);
  const [consent, setConsent] = useState(ws.settings.consentDeviceInventory);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sensorName, setSensorName] = useState('Home sensor');
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmAcct, setConfirmAcct] = useState(false);
  const [pw, setPw] = useState('');
  const live = ws.mode === 'live';

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setSaved(null);
    try { await ws.saveSettings({ name: name.trim() || 'Home', retentionDays: days, consentDeviceInventory: consent }); setSaved('Saved.'); } catch (x) { setErr(x instanceof Error ? x.message : 'Could not save'); }
  }
  async function enroll() {
    setErr(null);
    try { const r = await ws.enroll(sensorName.trim() || 'Home sensor'); setToken(r.token); sensors.reload(); } catch (x) { setErr(x instanceof Error ? x.message : 'Could not create sensor'); }
  }
  return (
    <div className="stack">
      <div><h1 className="page-title">Settings</h1>{live && <p className="muted">Signed in as {user?.email}</p>}</div>
      {err && <ErrorState message={err} />}
      {saved && <div role="status"><Banner tone="ok"><p>{saved}</p></Banner></div>}

      <form className="card" onSubmit={save} aria-labelledby="home-h">
        <h2 id="home-h" style={{ fontSize: '1.3rem' }}>Your home</h2>
        <Field label="Home name">{(p) => <input {...p} className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Keep measurements for (days)" hint="Older measurements are deleted automatically. Between 1 and 365.">{(p) => <input {...p} className="input" type="number" min={1} max={365} value={days} onChange={(e) => setDays(Number(e.target.value))} />}</Field>
        <label className="check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span><strong>Let my sensor look for devices on my network</strong><br /><span className="muted">The sensor reads its own computer&apos;s list of nearby devices. It doesn&apos;t scan or capture traffic. Off by default.</span></span></label>
        <div style={{ marginTop: 16 }}><Button type="submit" disabled={ws.mode === 'demo' && false}>Save changes</Button>{ws.mode === 'demo' && <span className="faint"> Demo changes stay in this tab.</span>}</div>
      </form>

      <section className="card stack" aria-labelledby="sens-h">
        <h2 id="sens-h" style={{ fontSize: '1.3rem' }}>Home sensor</h2>
        <p className="muted">A small program that runs on a computer at home and sends measurements out to NetShield. It never listens for incoming connections. You can disconnect it at any time.</p>
        {sensors.loading ? <Loading /> : sensors.data?.sensors.length ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>{sensors.data.sensors.map((s) => (
            <li key={s.id} className="card card-flat row-between"><span><strong>{s.name}</strong><br /><span className="faint">{SENSOR_META[s.status].help} Last heard {timeAgo(s.lastHeartbeatAt)}.</span></span>
              <span className="row"><Pill tone={SENSOR_META[s.status].tone}>{SENSOR_META[s.status].label}</Pill>
                {s.status !== 'REVOKED' && <Button size="sm" variant="danger" onClick={async () => { await ws.revoke(s.id); sensors.reload(); }}>Disconnect</Button>}</span></li>))}</ul>
        ) : <p className="muted">No sensor yet.</p>}
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}><Field label="New sensor name">{(p) => <input {...p} className="input" value={sensorName} maxLength={80} onChange={(e) => setSensorName(e.target.value)} />}</Field></div>
          <div style={{ marginBottom: 'var(--space-4)' }}><Button icon={KeyRound} onClick={enroll}>Create sensor token</Button></div>
        </div>
        {token && <SensorSetup token={token} demo={!live} />}
      </section>

      <section className="card stack" aria-labelledby="app-h">
        <h2 id="app-h" style={{ fontSize: '1.3rem' }}>Appearance &amp; notifications</h2>
        <Field label="Colour theme">{(p) => <select {...p} className="select" value={theme} onChange={(e) => setTheme(e.target.value as 'dark' | 'light' | 'system')}><option value="system">Match my device</option><option value="dark">Dark</option><option value="light">Light</option></select>}</Field>
        <label className="check" style={{ opacity: 0.6 }}><input type="checkbox" disabled /><span>Email me about problems <Pill tone="neutral">Needs an email service, not set up</Pill></span></label>
        <label className="check" style={{ opacity: 0.6 }}><input type="checkbox" disabled /><span>Billing &amp; plan <Pill tone="neutral">Not connected. Everything is free during this preview</Pill></span></label>
      </section>

      <section className="card stack" aria-labelledby="data-h">
        <h2 id="data-h" style={{ fontSize: '1.3rem' }}>Your data</h2>
        <div className="row"><LinkButton to={`${ws.basePath}/reports`} variant="secondary" icon={Download}>Export my data</LinkButton>
          <Button variant="danger" icon={Trash2} onClick={() => setConfirmDel(true)}>Delete collected data</Button>
          {live && <Button variant="danger" icon={Trash2} onClick={() => setConfirmAcct(true)}>Delete my account</Button>}</div>
      </section>

      <Dialog open={confirmDel} onClose={() => setConfirmDel(false)} title="Delete all collected data?">
        <p>This permanently removes measurements, devices, alerts and saved checks for {ws.siteName}. Sensors and settings stay. This can&apos;t be undone.</p>
        <div className="row" style={{ justifyContent: 'flex-end' }}><Button variant="ghost" onClick={() => setConfirmDel(false)}>Keep my data</Button>
          <Button variant="danger" onClick={async () => { try { await ws.deleteData(); setSaved('Collected data deleted.'); } catch (x) { setErr(x instanceof Error ? x.message : 'Failed'); } setConfirmDel(false); }}>Delete</Button></div>
      </Dialog>
      <Dialog open={confirmAcct} onClose={() => setConfirmAcct(false)} title="Delete your account?">
        <p>This removes your account and, if you&apos;re the only member, the whole home with everything in it. Enter your password to confirm.</p>
        <Field label="Password">{(p) => <input {...p} className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />}</Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}><Button variant="ghost" onClick={() => setConfirmAcct(false)}>Cancel</Button>
          <Button variant="danger" disabled={!pw} onClick={async () => { try { await api.deleteAccount(pw); window.location.assign('/'); } catch (x) { setErr(x instanceof Error ? x.message : 'Failed'); setConfirmAcct(false); } }}>Delete permanently</Button></div>
      </Dialog>
    </div>
  );
}

export function SensorSetup({ token, demo }: { token: string; demo: boolean }) {
  const [copied, setCopied] = useState(false);
  const cmd = `NETSHIELD_TOKEN=${token} java -jar netshield-agent.jar --api ${window.location.origin} --gateway <your router address, e.g. 192.168.1.1>`;
  return (
    <div className="stack" aria-live="polite">
      <Banner tone={demo ? 'demo' : 'warn'} title={demo ? 'Demo token. Not a real credential' : 'Copy this now. You won\'t see it again'}><p>{demo ? 'In a real account, a one-time token appears here.' : 'This token lets one sensor send measurements for this home. If it leaks, disconnect the sensor and create a new one.'}</p></Banner>
      <div className="token-box">{token}</div>
      <Button size="sm" variant="secondary" icon={Copy} onClick={async () => { await navigator.clipboard?.writeText(token); setCopied(true); }}>{copied ? 'Copied' : 'Copy token'}</Button>
      <TechDetails label="how to start the sensor"><p>On a computer at home with Java 17+, from the NetShield <code>services/agent</code> folder after <code>mvn package</code>:</p><pre><code>{cmd}</code></pre><p className="faint" style={{ marginBottom: 0 }}>On Windows PowerShell set <code>$env:NETSHIELD_TOKEN</code> first. Add <code>--device-inventory --approved-cidrs 192.168.1.0/24</code> only if you turned on device checking.</p></TechDetails>
    </div>
  );
}

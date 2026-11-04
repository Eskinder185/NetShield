import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy, Download, Laptop, Link2, Lock, Stethoscope, Users, Eye, XCircle } from 'lucide-react';
import { Banner, Button, Disclosure, Field, LinkButton, Pill } from '../../components/ui';
import { LinkChecker } from '../app/ScamShield';
import { AVAILABILITY, FAQ_ITEMS } from './content';
import { ProductPreview } from './Home';

function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <section className="page-hero"><div className="container">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{children && <p className="lead" style={{ marginBottom: 0 }}>{children}</p>}
    </div></section>
  );
}
const AVAIL_TONE = { 'Works today': 'ok', 'Needs home sensor': 'info', 'Needs compatible router': 'neutral', Planned: 'neutral' } as const;
const Avail = ({ s }: { s: keyof typeof AVAIL_TONE }) => <span className="avail"><Pill tone={AVAIL_TONE[s]}>{s}</Pill></span>;

/* -------- Features -------- */
export function Features() {
  const items = [
    [Stethoscope, 'Internet Doctor', 'Figures out whether the problem is your Wi-Fi, router, website lookups, your provider, or one website. Explains it simply and re-checks after you try a fix.', 'Needs home sensor', '/internet-doctor'],
    [Laptop, 'Home Guardian', 'A friendly list of the devices on your network. Name them, assign rooms and owners, and get a gentle alert when something new shows up.', 'Needs home sensor', '/home-security'],
    [CheckCircle2, 'Protection checklist', 'Seven high-value router and account settings, with plain reasons. Honest about what you reported versus what NetShield verified.', 'Works today', '/home-security'],
    [Link2, 'Scam Shield', 'Paste a link or QR address to see what looks suspicious. Includes a calm "I already clicked" plan and common scam patterns.', 'Works today', '/scam-shield'],
    [Users, 'Family', 'See whose devices are whose. Content filters and schedules need a compatible router and are clearly marked unavailable until then.', 'Planned', '/how-it-works'],
    [Lock, 'Privacy & control', 'See exactly what is collected, keep it for as long as you choose, export it, or delete it. Device checking is off until you say yes.', 'Works today', '/security'],
  ] as const;
  return (<>
    <PageHero eyebrow="Features" title="Everything explained in plain English.">Each feature is labelled with what it needs, so you always know what&apos;s working today.</PageHero>
    <section className="section"><div className="container grid grid-3">
      {items.map(([Icon, t, d, a, to]) => (
        <Link key={t} to={to} className="card card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="feature-icon"><Icon size={24} aria-hidden="true" /></div><h2 className="card-title">{t}<Avail s={a} /></h2><p className="muted" style={{ marginBottom: 0 }}>{d}</p></Link>))}
    </div></section>
  </>);
}

function FeaturePage({ eyebrow, title, intro, points, example, cta }: { eyebrow: string; title: string; intro: string; points: [string, string][]; example: ReactNode; cta: ReactNode }) {
  return (<>
    <PageHero eyebrow={eyebrow} title={title}>{intro}</PageHero>
    <section className="section"><div className="container grid grid-2" style={{ alignItems: 'start' }}>
      <div className="stack">{points.map(([t, d]) => <div key={t}><h2 className="card-title">{t}</h2><p className="muted">{d}</p></div>)}<div className="row">{cta}</div></div>
      <div>{example}<p className="faint" style={{ marginTop: 8 }}>Illustrative example.</p></div>
    </div></section>
  </>);
}

export const InternetDoctorPage = () => (
  <FeaturePage eyebrow="Internet Doctor" title="Why is my internet like this?" intro="Describe the problem. NetShield checks your router, website lookups and the wider internet, then tells you which one is the culprit."
    points={[['Plain answers', '"Websites are having trouble loading" instead of "DNS resolution failure". Technical details are one click away.'], ['A fix you can try', 'Safe, reversible steps. NetShield never changes your router by itself.'], ['Proof it worked', 'After you try a fix, it measures again and compares. If nothing changed, it says so.'], ['Honest when unsure', 'Too little data? You\'ll get "we can\'t tell yet", never a guess.']]}
    example={<ProductPreview />} cta={<><LinkButton to="/demo/internet-doctor">Try it in the demo</LinkButton><Avail s="Needs home sensor" /></>} />
);
export const HomeSecurityPage = () => (
  <FeaturePage eyebrow="Home Guardian" title="Know what's on your network." intro="See the devices NetShield has noticed, name them, and get a calm alert when something new appears."
    points={[['Your devices, in your words', 'Rename devices, assign rooms and owners, mark guests.'], ['Calm alerts', '"A device we don\'t recognize appeared": with what we know, what we don\'t, and what to do.'], ['Honest limits', 'Passive observation can\'t see every device. Phones with private addresses can look "new" when they rejoin. We tell you.'], ['A checklist that doesn\'t fib', 'Router and account settings you mark done stay "not confirmed" until NetShield can verify them.']]}
    example={<div className="card stack"><Pill tone="warn">1 device we don&apos;t recognize</Pill><h2 className="card-title" style={{ margin: 0 }}>Unknown device · 192.168.1.57</h2><p className="muted" style={{ margin: 0 }}>First seen 38 minutes ago. Uses a private address, so its maker can&apos;t be identified.</p><span className="btn btn-primary btn-sm" aria-hidden="true" style={{ justifySelf: 'start' }}>Help me identify this</span></div>}
    cta={<><LinkButton to="/demo/devices">Try it in the demo</LinkButton><Avail s="Needs home sensor" /></>} />
);

export function ScamShieldPage() {
  return (<>
    <PageHero eyebrow="Scam Shield" title="Not sure about that link?">Paste it here. We&apos;ll point out what looks suspicious without opening it.</PageHero>
    <section className="section"><div className="container-narrow stack">
      <div className="card"><LinkChecker /></div>
      <Banner tone="info" title="How to read the result"><p>&ldquo;Warning signs&rdquo; means look closer. &ldquo;No warning signs&rdquo; means we saw nothing odd in the link&apos;s shape. It never means safe. We don&apos;t visit sites or check their reputation.</p></Banner>
      <p><Avail s="Works today" /> Already clicked something? The <Link to="/demo/scam-shield">steps to take</Link> are in the app.</p>
    </div></section>
  </>);
}

/* -------- How it works -------- */
export function HowItWorks() {
  const levels = [
    ['In your browser', 'Check links for scam signs. Browse the demo. Use the checklist.', 'Nothing about your network is measured. A website can\'t see inside your home.', 'Works today'],
    ['With the home sensor', 'Live internet checks, diagnoses, new-device alerts (with your consent).', 'Runs on a computer at home, makes outgoing connections only, needs no special permissions, and can be disconnected anytime.', 'Needs home sensor'],
    ['With a compatible router', 'Verify router settings, apply family controls, isolate devices.', 'Not built yet. When it is, every change will ask you first and be reversible.', 'Planned'],
  ] as const;
  return (<>
    <PageHero eyebrow="How it works" title="Start simple. Add more only if you want to.">NetShield only does what you&apos;ve allowed. Here&apos;s what each level can and can&apos;t see.</PageHero>
    <section className="section"><div className="container stack">
      <div className="grid grid-3">{levels.map(([t, w, l, a], i) => (
        <div key={t} className="card"><Pill tone="info">Level {i + 1}</Pill><h2 className="card-title" style={{ marginTop: 12 }}>{t}<Avail s={a} /></h2><p><strong>Can:</strong> {w}</p><p className="muted" style={{ marginBottom: 0 }}><strong>Limits:</strong> {l}</p></div>))}</div>
      <h2>The sensor, in plain terms</h2>
      <div className="grid grid-2">
        <div className="card"><h3>What it does</h3><ul className="check-list"><li><CheckCircle2 size={18} aria-hidden="true" /><span>Checks if your router answers</span></li><li><CheckCircle2 size={18} aria-hidden="true" /><span>Checks if website names resolve, and how fast</span></li><li><CheckCircle2 size={18} aria-hidden="true" /><span>Optionally reads its computer&apos;s list of nearby devices, in the address range you choose</span></li></ul></div>
        <div className="card"><h3>What it never does</h3><ul className="check-list no"><li><XCircle size={18} aria-hidden="true" /><span>Capture or inspect your traffic</span></li><li><XCircle size={18} aria-hidden="true" /><span>Scan networks or probe anything you didn&apos;t list</span></li><li><XCircle size={18} aria-hidden="true" /><span>Change your router, DNS, firewall or Wi-Fi</span></li><li><XCircle size={18} aria-hidden="true" /><span>Accept incoming connections</span></li></ul></div>
      </div>
      <LinkButton to="/demo" size="lg">Try the demo</LinkButton>
    </div></section>
  </>);
}

/* -------- Pricing -------- */
export function Pricing() {
  const plans = [
    ['Free', '$0', 'For trying it out', ['Scam Shield link checker', 'Security checklist', '1 home, 1 sensor', 'Internet Doctor', '30-day history']],
    ['Home Plus', '$—', 'Proposed', ['Everything in Free', 'Longer history', 'Evidence report for your provider', 'Weekly summary']],
    ['Family', '$—', 'Proposed', ['Everything in Home Plus', 'Family member views', 'Family controls (needs compatible router)']],
    ['Small Business', '$—', 'Proposed', ['Several sites', 'Roles and shared incidents', 'Monthly report']],
  ] as const;
  return (<>
    <PageHero eyebrow="Pricing (preview)" title="Simple plans. Not for sale yet.">This is a proposal to get feedback. There is no checkout, and prices aren&apos;t set.</PageHero>
    <section className="section"><div className="container stack">
      <Banner tone="warn" title="Preview pricing"><p>Nothing here can be purchased. During the preview, everything that works is free. Paid-plan features marked &ldquo;proposed&rdquo; are ideas, not promises.</p></Banner>
      <div className="grid grid-4">{plans.map(([n, p, s, f], i) => (
        <div key={n} className={`card${i === 0 ? ' plan-featured' : ''}`}><Pill tone={i === 0 ? 'ok' : 'neutral'}>{s}</Pill><h2 className="card-title" style={{ marginTop: 12 }}>{n}</h2><div className="price">{p}</div>
          <ul className="check-list" style={{ marginTop: 16 }}>{f.map((x) => <li key={x}><CheckCircle2 size={16} aria-hidden="true" /><span>{x}</span></li>)}</ul>
          {i === 0 ? <LinkButton to="/register" block>Create free account</LinkButton> : <Button block disabled variant="secondary">Not available yet</Button>}</div>))}</div>
      <h2>What works today</h2>
      <div className="table-wrap"><table><thead><tr><th>Feature</th><th>Needs</th><th>Status</th></tr></thead><tbody>{AVAILABILITY.map((a) => <tr key={a.feature}><td>{a.feature}</td><td>{a.level}</td><td><Avail s={a.status} /></td></tr>)}</tbody></table></div>
    </div></section>
  </>);
}

/* -------- About / Contact / FAQ / Docs -------- */
export const About = () => (<>
  <PageHero eyebrow="About" title="An early project with a simple goal.">Make home internet and security understandable to people who never wanted to learn networking.</PageHero>
  <section className="section"><div className="container-narrow prose">
    <p>NetShield is an early-stage, in-development project. There are no customers, awards, certifications or partnerships to show, and we won&apos;t invent any.</p>
    <h2>What we believe</h2>
    <ul><li><strong>Evidence over alarm.</strong> Every finding shows what was measured, when, and how sure we are.</li><li><strong>Plain language first.</strong> Technical detail is always available, never in your face.</li><li><strong>Privacy by default.</strong> Local-first, minimal collection, deletable.</li><li><strong>No fake protection.</strong> If we can&apos;t see it, we say so.</li></ul>
    <p>Read the <Link to="/security">security approach</Link> and <Link to="/privacy">privacy draft</Link>, or <Link to="/contact">tell us what you think</Link>.</p>
  </div></section>
</>);

export function Contact() {
  const [msg, setMsg] = useState(''); const [kind, setKind] = useState('Feedback'); const [copied, setCopied] = useState(false);
  const text = `[NetShield ${kind}]\n\n${msg}`;
  return (<>
    <PageHero eyebrow="Contact & feedback" title="Tell us what you think.">We&apos;re listening, but there&apos;s no live inbox connected to this build yet.</PageHero>
    <section className="section"><div className="container-narrow stack">
      <Banner tone="info" title="No message is sent from this page"><p>This preview isn&apos;t connected to an email or support service, so a form that said &ldquo;sent&rdquo; would be untrue. Write your note here, copy it, and send it through whichever channel the project owner shares with you. Contact details will be added when they exist.</p></Banner>
      <div className="card">
        <Field label="Type">{(p) => <select {...p} className="select" value={kind} onChange={(e) => setKind(e.target.value)}><option>Feedback</option><option>Bug report</option><option>Question</option><option>Waitlist request</option></select>}</Field>
        <Field label="Your note" hint="Please don't include passwords or personal details.">{(p) => <textarea {...p} className="textarea" value={msg} maxLength={2000} onChange={(e) => setMsg(e.target.value)} />}</Field>
        <div className="row"><Button icon={Copy} disabled={!msg.trim()} onClick={async () => { await navigator.clipboard?.writeText(text); setCopied(true); }}>Copy note</Button>
          <Button variant="secondary" icon={Download} disabled={!msg.trim()} onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = 'netshield-feedback.txt'; a.click(); }}>Save as file</Button></div>
        <div role="status">{copied && <p className="faint" style={{ marginTop: 8 }}>Copied to your clipboard.</p>}</div>
      </div>
    </div></section>
  </>);
}

export const Faq = () => (<>
  <PageHero eyebrow="FAQ" title="Frequently asked questions" />
  <section className="section"><div className="container-narrow">{FAQ_ITEMS.map((f) => <Disclosure key={f.q} title={f.q}>{f.a}</Disclosure>)}</div></section>
</>);

export const Docs = () => (<>
  <PageHero eyebrow="Help" title="Getting started and troubleshooting." />
  <section className="section"><div className="container-narrow prose">
    <h2>Try it without installing</h2><p>Open the <Link to="/demo">demo</Link>. Everything there is made-up data held in your browser.</p>
    <h2>Run NetShield locally</h2>
    <pre><code>{`# 1. database (PostgreSQL) and API
docker compose up -d db
cd services/api && mvn spring-boot:run

# 2. web app
cd apps/web && npm install && npm run dev      # http://127.0.0.1:5173`}</code></pre>
    <p>See <code>README.md</code> in the repository for Windows PowerShell commands and the Docker route.</p>
    <h2>Connect a home sensor</h2>
    <ol><li>Create an account and open <strong>Settings → Home sensor</strong>.</li><li>Press <em>Create sensor token</em> and copy it. It&apos;s shown once.</li><li>On a computer at home run the agent with that token and your router&apos;s address.</li><li>The sensor shows <em>Online</em> within a minute. Disconnect it anytime in Settings.</li></ol>
    <h2>Troubleshooting</h2>
    <ul><li><strong>Sensor stays &ldquo;Waiting to connect&rdquo;:</strong> check the token was pasted in full, the API address is reachable, and the token hasn&apos;t expired (7 days to first connect).</li><li><strong>&ldquo;Not enough information&rdquo;:</strong> leave the sensor running for a few minutes.</li><li><strong>No devices listed:</strong> device checking must be turned on in Settings, and the sensor started with <code>--device-inventory --approved-cidrs …</code>.</li></ul>
    <h2>What works today</h2>
    <div className="table-wrap"><table><thead><tr><th>Feature</th><th>Needs</th><th>Status</th></tr></thead><tbody>{AVAILABILITY.map((a) => <tr key={a.feature}><td>{a.feature}</td><td>{a.level}</td><td>{a.status}</td></tr>)}</tbody></table></div>
  </div></section>
</>);

/* -------- Legal drafts -------- */
function Draft({ title, children }: { title: string; children: ReactNode }) {
  return (<>
    <PageHero eyebrow="Draft" title={title} />
    <section className="section"><div className="container-narrow prose">
      <Banner tone="warn" title="Draft: not reviewed"><p>This is a plain-language draft written by the project team. It has not been reviewed by a lawyer or a security professional and is not a binding agreement or a certification.</p></Banner>
      <div style={{ marginTop: 24 }}>{children}</div>
    </div></section>
  </>);
}
export const Privacy = () => (<Draft title="Privacy notice">
  <h2>What we collect</h2><ul><li><strong>Account:</strong> email, display name, password (stored only as a salted hash).</li><li><strong>Measurements</strong> from your sensor: response times and success or failure for your router, a few website lookups and a few public destinations.</li><li><strong>Devices</strong> (only if you turn it on): a one-way fingerprint of each hardware address, its address on your network, and its network name.</li></ul>
  <h2>What we don&apos;t collect</h2><ul><li>Websites you visit, message contents or traffic.</li><li>Links you paste into Scam Shield. They&apos;re analysed as text and not stored.</li></ul>
  <h2>Your controls</h2><p>Choose retention (1–365 days), export everything, delete collected data, or delete your account. Device checking is off until you consent.</p>
  <h2>Third parties</h2><p>None by default. No analytics, ads, AI services or email providers are connected.</p>
  <h2>Open questions for review</h2><p>Retention of audit logs, jurisdiction-specific notices, and a data-processing description for hosted use.</p>
</Draft>);
export const Terms = () => (<Draft title="Terms of use">
  <h2>Preview software</h2><p>NetShield is an early preview provided &ldquo;as is&rdquo;. Features may change or be removed.</p>
  <h2>No guarantee of protection</h2><p>NetShield gives information and suggestions. It cannot guarantee that your network is secure, that a link is safe, or that a diagnosis is correct. Don&apos;t rely on it as your only safeguard.</p>
  <h2>Your responsibilities</h2><p>Only run the sensor on networks you own or are authorized to monitor. Only enter addresses you are authorized to include.</p>
  <h2>Open questions for review</h2><p>Liability limits, governing law, acceptable use and billing terms are not yet written.</p>
</Draft>);
export const SecurityPage = () => (<Draft title="Security practices">
  <h2>What is implemented today</h2>
  <ul><li>Passwords hashed with bcrypt (cost 12); login attempts rate-limited.</li><li>Session cookies are HttpOnly and SameSite; state-changing requests need a CSRF token.</li><li>Every home and site resource is checked against your membership; other people&apos;s IDs return &ldquo;not found&rdquo;.</li><li>Sensor tokens are random, stored only as hashes, expire and can be revoked. Sensors only connect outward.</li><li>Scam Shield never fetches pasted links.</li><li>Inputs are validated, errors don&apos;t leak internals, and CSV exports neutralize spreadsheet formulas.</li></ul>
  <h2>What is not done</h2><ul><li>Multi-factor authentication, email verification and password reset.</li><li>Independent security review or penetration test.</li><li>Encryption at rest (depends on your database setup) and certificate management for hosted use.</li></ul>
  <h2>Reporting a problem</h2><p>A security contact has not been set up yet. See <Link to="/contact">Contact</Link>.</p>
  <p className="faint"><Eye size={14} aria-hidden="true" /> The full threat model is in the repository under <code>docs/THREAT_MODEL.md</code>.</p>
</Draft>);

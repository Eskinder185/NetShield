import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Gamepad2, GraduationCap, Home as HomeIcon, Laptop, Link2, ShieldQuestion, Stethoscope, Store, UserRound, Video, Wifi,
} from 'lucide-react';
import { Disclosure, LinkButton, Pill } from '../../components/ui';
import { FAQ_ITEMS } from './content';

export function ProductPreview() {
  return (
    <figure className="preview" aria-label="Illustration of the NetShield home screen" style={{ margin: 0 }}>
      <div className="preview-bar" aria-hidden="true"><i /><i /><i /><span className="faint" style={{ marginLeft: 8 }}>Illustration, not a live screen</span></div>
      <div className="preview-body">
        <div className="preview-status">
          <div className="ring" aria-hidden="true"><Wifi size={26} /></div>
          <div><strong style={{ fontSize: '1.15rem', display: 'block' }}>Websites are having trouble loading.</strong>
            <span className="muted">Your router is fine. The service that finds websites isn&apos;t answering.</span></div>
        </div>
        <div className="card card-flat" style={{ padding: 'var(--space-4)' }}>
          <Pill tone="warn">What you can do</Pill>
          <p style={{ margin: '10px 0 12px' }}>Restart your router, or switch to a different lookup service. Then we&apos;ll check again.</p>
          <span className="btn btn-primary btn-sm" aria-hidden="true">Help me fix this</span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card card-flat" style={{ padding: 14 }}><span className="faint">Devices</span><br /><strong>1 we don&apos;t recognize</strong></div>
          <div className="card card-flat" style={{ padding: 14 }}><span className="faint">Router settings</span><br /><strong>Not confirmed yet</strong></div>
        </div>
      </div>
    </figure>
  );
}

const WHO = [
  [UserRound, 'A parent', 'Wants to know what is on the family network, and gentle ways to talk about safe use.'],
  [HomeIcon, 'An older adult', 'Gets a suspicious text. Pastes the link and gets a calm, clear answer, and a checklist if they already clicked.'],
  [Gamepad2, 'A gamer', 'Lag spikes even with fast internet. Learns whether it is Wi-Fi, the router or the provider.'],
  [Video, 'A remote worker', 'Calls freeze at 2pm. Gets evidence showing when and where the connection gets uneven.'],
  [GraduationCap, 'A student', 'Dorm Wi-Fi drops. Finds out if it is the room, the building, or the network.'],
  [Store, 'A tiny business', 'No IT person. Gets plain-language checks and an evidence report to send the provider.'],
] as const;

export function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Your digital home&apos;s security &amp; internet doctor</span>
            <h1>Know what&apos;s wrong with your internet, <span className="gradient-text">and how to fix it.</span></h1>
            <p className="lead">NetShield tells you in plain English why your internet is slow, which devices are on your network, and whether that link is a scam. It shows you what it found, helps you fix it, and checks that the fix worked.</p>
            <div className="hero-cta">
              <LinkButton to="/demo" size="lg" icon={Stethoscope}>Try the interactive demo</LinkButton>
              <LinkButton to="/register" size="lg" variant="secondary">Create a free account</LinkButton>
            </div>
            <div className="trust-line">
              <span><CheckCircle2 size={16} aria-hidden="true" />No credit card, no ads</span>
              <span><CheckCircle2 size={16} aria-hidden="true" />Works without any AI service</span>
              <span><CheckCircle2 size={16} aria-hidden="true" />Honest about what it can&apos;t see</span>
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">Five answers in seconds</span>
          <h2>Open NetShield and know where you stand.</h2>
          <div className="grid grid-3" style={{ marginTop: 'var(--space-5)' }}>
            {[['Is my internet working properly?', 'A plain verdict, plus the evidence behind it.'], ['Are there security problems?', 'Prioritized, with the reason each one matters.'], ['Are my devices OK?', 'Which ones we know, which ones we don\'t.'], ['What should I do next?', 'One clear next step at a time.'], ['Can NetShield help fix it?', 'Guided steps, then a re-check to confirm.']].map(([q, a]) => (
              <div key={q} className="card"><h3>{q}</h3><p className="muted" style={{ marginBottom: 0 }}>{a}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-elev)', borderBlock: '1px solid var(--border)' }}>
        <div className="container">
          <span className="eyebrow">What it does</span>
          <h2>Three everyday problems, solved in plain language.</h2>
          <div className="grid grid-3" style={{ marginTop: 'var(--space-5)' }}>
            <Link to="/internet-doctor" style={{ textDecoration: 'none', color: 'inherit' }} className="card card-hover">
              <div className="feature-icon"><Stethoscope size={24} aria-hidden="true" /></div><h3>Internet Doctor</h3>
              <p className="muted">Is it your Wi-Fi, your router, the lookup service, or your provider? Describe the problem and get a diagnosis you can understand.</p><span className="row">Learn more <ArrowRight size={16} aria-hidden="true" /></span></Link>
            <Link to="/home-security" style={{ textDecoration: 'none', color: 'inherit' }} className="card card-hover">
              <div className="feature-icon"><Laptop size={24} aria-hidden="true" /></div><h3>Home Guardian</h3>
              <p className="muted">See the devices on your network, spot ones you don&apos;t recognize, and work through a short checklist for your router and accounts.</p><span className="row">Learn more <ArrowRight size={16} aria-hidden="true" /></span></Link>
            <Link to="/scam-shield" style={{ textDecoration: 'none', color: 'inherit' }} className="card card-hover">
              <div className="feature-icon"><Link2 size={24} aria-hidden="true" /></div><h3>Scam Shield</h3>
              <p className="muted">Paste a suspicious link and learn what looks off, without ever opening it. Plus a calm checklist if you already clicked.</p><span className="row">Learn more <ArrowRight size={16} aria-hidden="true" /></span></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h2>Detect. Explain. Fix. Verify.</h2>
          <div className="grid grid-4 steps-grid" style={{ marginTop: 'var(--space-5)' }}>
            {[['Notice', 'A small home sensor measures your router, website lookups and the wider internet.'], ['Explain', 'Fixed, explainable rules turn the numbers into one plain sentence.'], ['Fix', 'You get a safe next step. NetShield never changes your router on its own.'], ['Verify', 'It measures again and only says "fixed" if the new numbers show it.']].map(([t, d]) => (
              <div key={t} className="how-step"><h3>{t}</h3><p className="muted">{d}</p></div>
            ))}
          </div>
          <LinkButton to="/how-it-works" variant="secondary">See what each level of setup can do</LinkButton>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-elev)', borderBlock: '1px solid var(--border)' }}>
        <div className="container">
          <span className="eyebrow">Who it&apos;s for</span>
          <h2>Made for people who just want it to work.</h2>
          <p className="faint">These are illustrative situations, not customer stories.</p>
          <div className="grid grid-3" style={{ marginTop: 'var(--space-5)' }}>
            {WHO.map(([Icon, t, d]) => <div key={t} className="card"><div className="feature-icon"><Icon size={22} aria-hidden="true" /></div><h3>{t}</h3><p className="muted" style={{ marginBottom: 0 }}>{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-narrow">
          <span className="eyebrow">Straight talk</span>
          <h2>What NetShield will and won&apos;t claim.</h2>
          <div className="grid grid-2" style={{ marginTop: 'var(--space-5)' }}>
            <div className="card"><h3>It will</h3><ul className="check-list">
              <li><CheckCircle2 size={18} aria-hidden="true" /><span>Show the evidence behind every finding</span></li>
              <li><CheckCircle2 size={18} aria-hidden="true" /><span>Say &ldquo;we can&apos;t tell&rdquo; when it can&apos;t</span></li>
              <li><CheckCircle2 size={18} aria-hidden="true" /><span>Keep your data local-first and deletable</span></li></ul></div>
            <div className="card"><h3>It won&apos;t</h3><ul className="check-list no">
              <li><ShieldQuestion size={18} aria-hidden="true" /><span>Promise 100% protection</span></li>
              <li><ShieldQuestion size={18} aria-hidden="true" /><span>Call a link &ldquo;safe&rdquo; because it found nothing</span></li>
              <li><ShieldQuestion size={18} aria-hidden="true" /><span>Pretend a feature works when it needs setup</span></li></ul></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-narrow">
          <h2 className="center">Questions people ask</h2>
          <div style={{ marginTop: 'var(--space-5)' }}>{FAQ_ITEMS.slice(0, 5).map((f) => <Disclosure key={f.q} title={f.q}>{f.a}</Disclosure>)}</div>
          <p className="center" style={{ marginTop: 16 }}><Link to="/faq">See all questions</Link></p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="card center" style={{ padding: 'var(--space-7) var(--space-5)', background: 'var(--gradient-hero), var(--surface)' }}>
            <h2>See it before you set anything up.</h2>
            <p className="lead" style={{ margin: '0 auto var(--space-5)' }}>The demo uses made-up data so you can click through every screen safely.</p>
            <div className="row" style={{ justifyContent: 'center' }}><LinkButton to="/demo" size="lg">Try the demo</LinkButton><LinkButton to="/register" size="lg" variant="secondary">Create an account</LinkButton></div>
          </div>
        </div>
      </section>
    </>
  );
}

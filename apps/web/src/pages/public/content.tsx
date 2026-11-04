import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const FAQ_ITEMS: { q: string; a: ReactNode }[] = [
  { q: 'Do I need to install anything?', a: <p>For the Scam Shield link checker, no, it works in your browser. To diagnose your home internet or notice new devices, you need the small NetShield home sensor on a computer at home, because a website can&apos;t see inside your network.</p> },
  { q: 'Is NetShield free?', a: <p>During this preview everything is free and there is no payment system. The <Link to="/pricing">pricing page</Link> shows a proposed plan structure that is not final and not for sale yet.</p> },
  { q: 'Will it slow down or change my network?', a: <p>No. The sensor makes a few small outgoing checks per minute. It doesn&apos;t capture your traffic and never changes your router, DNS, firewall or Wi-Fi settings.</p> },
  { q: 'Can NetShield see which websites I visit?', a: <p>No. It measures how quickly a handful of test destinations respond. It doesn&apos;t see your browsing, messages or traffic.</p> },
  { q: 'Does it use AI?', a: <p>No AI is needed or on by default. Diagnoses come from fixed, explainable rules. Nothing is sent to an AI service. An optional AI helper may be added later, and it would stay off unless you configure it.</p> },
  { q: 'If Scam Shield says nothing is wrong, is the link safe?', a: <p>Not necessarily. It only checks the shape of the link for warning signs. It doesn&apos;t visit the site or look up its reputation, so &ldquo;no warning signs&rdquo; is never a guarantee. If you weren&apos;t expecting it, go to the company&apos;s website yourself.</p> },
  { q: 'Can it block websites or manage my kids\' internet?', a: <p>Not today. That requires a compatible router or DNS service, which NetShield doesn&apos;t connect to yet. Those controls are shown as unavailable rather than faked.</p> },
  { q: 'Is there a VPN?', a: <p>No. NetShield doesn&apos;t run a VPN service. The app explains what a VPN does and doesn&apos;t protect against.</p> },
  { q: 'How do I delete my data?', a: <p>In Settings you can export everything, delete collected data, or delete your account. Measurements are also removed automatically after the number of days you choose.</p> },
  { q: 'Is it ready for everyone?', a: <p>No. NetShield is an early build. Many ideas are on the roadmap but not built; the <Link to="/docs">help pages</Link> list what works today.</p> },
];

export const AVAILABILITY: { feature: string; level: string; status: 'Works today' | 'Needs home sensor' | 'Needs compatible router' | 'Planned' }[] = [
  { feature: 'Scam Shield link checker', level: 'Browser', status: 'Works today' },
  { feature: 'Internet Doctor diagnosis, retest and history', level: 'Home sensor', status: 'Needs home sensor' },
  { feature: 'New-device alerts and device naming', level: 'Home sensor + your consent', status: 'Needs home sensor' },
  { feature: 'Security checklist (self-reported)', level: 'Browser', status: 'Works today' },
  { feature: 'Verified router security checks', level: 'Compatible router', status: 'Planned' },
  { feature: 'Website blocking and family schedules', level: 'Compatible router or DNS service', status: 'Planned' },
  { feature: 'VPN to your home', level: 'Your own WireGuard server', status: 'Planned' },
  { feature: 'Email alerts, billing', level: 'Third-party services', status: 'Planned' },
];

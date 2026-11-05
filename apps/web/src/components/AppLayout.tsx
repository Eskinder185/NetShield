import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Stethoscope, Laptop, ShieldCheck, Link2, Users, Lock, FileText, MessageCircle, FlaskConical, Settings, LogOut, MoreHorizontal, X, Gauge,
} from 'lucide-react';
import { Banner, Logo, Pill } from './ui';
import { ThemeToggle } from './PublicLayout';
import { useWorkspace } from '../lib/workspace';
import { useAuth } from '../lib/hooks';

const ITEMS = [
  { to: '', label: 'Home', icon: Home, group: 'Your home', end: true },
  { to: 'internet-doctor', label: 'Internet Doctor', icon: Stethoscope, group: 'Your home' },
  { to: 'devices', label: 'My Devices', icon: Laptop, group: 'Your home' },
  { to: 'protection', label: 'Protection', icon: ShieldCheck, group: 'Your home' },
  { to: 'scam-shield', label: 'Scam Shield', icon: Link2, group: 'Stay safe' },
  { to: 'helpers', label: 'Trusted helpers', icon: Users, group: 'Stay safe' },
  { to: 'family', label: 'Family', icon: Users, group: 'Stay safe' },
  { to: 'privacy', label: 'Privacy & VPN', icon: Lock, group: 'Stay safe' },
  { to: 'reports', label: 'Reports', icon: FileText, group: 'More' },
  { to: 'assistant', label: 'Assistant', icon: MessageCircle, group: 'More' },
  { to: 'lab', label: 'Advanced Lab', icon: FlaskConical, group: 'More' },
  { to: 'settings', label: 'Settings', icon: Settings, group: 'More' },
];
const BOTTOM = ['', 'internet-doctor', 'devices', 'scam-shield'];

export function AppLayout() {
  const ws = useWorkspace();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [more, setMore] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setMore(false); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => { if (more) sheetRef.current?.querySelector<HTMLElement>('a,button')?.focus(); }, [more]);
  const href = (to: string) => (to ? `${ws.basePath}/${to}` : ws.basePath);
  const groups = Array.from(new Set(ITEMS.map((i) => i.group)));
  const demo = ws.mode === 'demo';

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to main content</a>
      <aside className="sidebar no-print">
        <Link to={demo ? '/' : '/app'} aria-label="NetShield"><Logo /></Link>
        <nav aria-label="App">
          {groups.map((g) => (
            <div key={g}>
              <div className="side-group">{g}</div>
              {ITEMS.filter((i) => i.group === g).map((i) => (
                <NavLink key={i.to} to={href(i.to)} end={i.end} className="side-link"><i.icon size={20} aria-hidden="true" />{i.label}</NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }} className="faint">
          {demo ? <Link className="side-sub" to="/register">Create a real account →</Link> : <>Signed in as<br /><strong>{user?.displayName}</strong></>}
        </div>
      </aside>
      <div className="app-main">
        <header className="app-top no-print">
          <div className="row">
            <span className="mobile-top-menu"><Link to={demo ? '/' : '/app'} aria-label="NetShield"><Logo size={26} /></Link></span>
            <span className="site-name">{ws.siteName}</span>
            {demo ? <Pill tone="demo">Demo data</Pill> : <Pill tone="info" icon={Gauge}>Live workspace</Pill>}
          </div>
          <div className="row">
            <ThemeToggle />
            {demo
              ? <Link className="btn btn-secondary btn-sm" to="/">Exit demo</Link>
              : <button type="button" className="btn btn-ghost btn-sm" onClick={async () => { await logout(); nav('/'); }}><LogOut size={16} aria-hidden="true" />Sign out</button>}
          </div>
        </header>
        <main id="main" tabIndex={-1} className="app-content">
          {demo && (
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <Banner tone="demo" title="You're exploring a demo">
                <p>Everything here is made-up sample data so you can try NetShield safely. It is not measuring your network and nothing leaves your browser.</p>
              </Banner>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav no-print" aria-label="Quick navigation">
        {ITEMS.filter((i) => BOTTOM.includes(i.to)).map((i) => (
          <NavLink key={i.to} to={href(i.to)} end={i.end}><i.icon size={22} aria-hidden="true" />{i.label.replace('Internet Doctor', 'Internet').replace('My Devices', 'Devices').replace('Scam Shield', 'Scams')}</NavLink>
        ))}
        <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" aria-expanded={more}><MoreHorizontal size={22} aria-hidden="true" />More</button>
      </nav>
      {more && (
        <div className="more-sheet" onClick={() => setMore(false)}>
          <div className="more-sheet-panel" ref={sheetRef} role="dialog" aria-modal="true" aria-label="More pages" onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Escape' && setMore(false)}>
            <div className="row-between" style={{ marginBottom: 8 }}><strong>More</strong>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setMore(false)}><X size={20} aria-hidden="true" /></button></div>
            <nav aria-label="More pages" style={{ display: 'grid', gap: 2 }}>
              {ITEMS.filter((i) => !BOTTOM.includes(i.to)).map((i) => (
                <NavLink key={i.to} to={href(i.to)} className="side-link"><i.icon size={20} aria-hidden="true" />{i.label}</NavLink>
              ))}
              {demo ? <Link className="side-link" to="/">Exit demo</Link>
                : <button type="button" className="side-link" style={{ background: 'none', border: 0, font: 'inherit', cursor: 'pointer' }} onClick={async () => { await logout(); nav('/'); }}><LogOut size={20} aria-hidden="true" />Sign out</button>}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

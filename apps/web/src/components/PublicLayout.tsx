import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, Moon, Monitor, Sun, X } from 'lucide-react';
import { LinkButton, Logo } from './ui';
import { useAuth, useTheme } from '../lib/hooks';

const NAV = [
  { to: '/features', label: 'Features' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/faq', label: 'FAQ' },
  { to: '/docs', label: 'Help' },
];

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  return (
    <button type="button" className="icon-btn" onClick={() => setTheme(next)} aria-label={`Colour theme: ${theme}. Switch to ${next}.`} title={`Theme: ${theme}`}>
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { user } = useAuth();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <header className="site-header no-print">
        <div className="container site-header-inner">
          <Link to="/" aria-label="NetShield home"><Logo /></Link>
          <nav aria-label="Main" className={`nav-links${open ? ' open' : ''}`} id="main-nav">
            {NAV.map((n) => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
            <NavLink to="/demo">Try the demo</NavLink>
          </nav>
          <div className="nav-actions">
            <ThemeToggle />
            {user
              ? <LinkButton to="/app" size="sm">Open my home</LinkButton>
              : <><span className="hide-sm"><LinkButton to="/login" variant="ghost" size="sm">Sign in</LinkButton></span><LinkButton to="/register" size="sm">Get started</LinkButton></>}
            <button type="button" className="icon-btn menu-toggle" aria-expanded={open} aria-controls="main-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
              {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="site-footer no-print">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Logo />
              <p className="faint" style={{ marginTop: 12, maxWidth: 320 }}>Your digital home&apos;s security and internet doctor. NetShield is an early-stage project: see the <Link to="/docs">help pages</Link> for what works today.</p>
            </div>
            <div><h2 className="footer-h">Product</h2><ul>
              <li><Link to="/internet-doctor">Internet Doctor</Link></li><li><Link to="/home-security">Home security</Link></li>
              <li><Link to="/scam-shield">Scam Shield</Link></li><li><Link to="/demo">Interactive demo</Link></li></ul></div>
            <div><h2 className="footer-h">Learn</h2><ul>
              <li><Link to="/how-it-works">How it works</Link></li><li><Link to="/pricing">Pricing (preview)</Link></li>
              <li><Link to="/faq">FAQ</Link></li><li><Link to="/docs">Help &amp; docs</Link></li></ul></div>
            <div><h2 className="footer-h">Company</h2><ul>
              <li><Link to="/about">About</Link></li><li><Link to="/contact">Contact &amp; feedback</Link></li>
              <li><Link to="/privacy">Privacy (draft)</Link></li><li><Link to="/terms">Terms (draft)</Link></li><li><Link to="/security">Security (draft)</Link></li></ul></div>
          </div>
          <p className="faint" style={{ marginTop: 32 }}>NetShield cannot promise complete protection. Results depend on what your setup lets it measure. Legal pages are drafts awaiting legal and security review.</p>
        </div>
      </footer>
    </>
  );
}

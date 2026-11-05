import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { AppLayout } from './components/AppLayout';
import { Loading } from './components/ui';
import { Home } from './pages/public/Home';
import {
  About, Contact, Docs, Faq, Features, HomeSecurityPage, HowItWorks, InternetDoctorPage, Pricing, Privacy, ScamShieldPage, SecurityPage, Terms,
} from './pages/public/Pages';
import { Dashboard } from './pages/app/Dashboard';
import { InternetDoctor } from './pages/app/InternetDoctor';
import { Devices } from './pages/app/Devices';
import { Protection } from './pages/app/Protection';
import { ScamShield } from './pages/app/ScamShield';
import { TrustedHelpers } from './pages/app/TrustedHelpers';
import { Assistant, Family, Lab, PrivacyVpn, Reports, SettingsPage } from './pages/app/More';
import { Login, Register } from './pages/app/Auth';
import { Onboarding } from './pages/app/Onboarding';
import { WorkspaceContext } from './lib/workspace';
import { createDemoWorkspace } from './demo/demoWorkspace';
import { createLiveWorkspace } from './lib/liveWorkspace';
import { useAuth } from './lib/hooks';

function NotFound() {
  return (
    <div className="container-narrow section center">
      <h1>We can&apos;t find that page</h1>
      <p className="lead" style={{ margin: '0 auto 24px' }}>The link may be old or mistyped.</p>
      <a className="btn btn-primary" href="/">Go to the home page</a>
    </div>
  );
}

/** Demo and live share every app page; only the workspace behind them differs. */
function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="internet-doctor" element={<InternetDoctor />} />
      <Route path="devices" element={<Devices />} />
      <Route path="protection" element={<Protection />} />
      <Route path="scam-shield" element={<ScamShield />} />
      <Route path="helpers" element={<TrustedHelpers />} />
      <Route path="family" element={<Family />} />
      <Route path="privacy" element={<PrivacyVpn />} />
      <Route path="reports" element={<Reports />} />
      <Route path="assistant" element={<Assistant />} />
      <Route path="lab" element={<Lab />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function DemoShell({ children }: { children: ReactNode }) {
  const ws = useMemo(() => createDemoWorkspace(), []);
  const [, force] = useState(0);
  // Let components reading ws.demoScenario re-render after the scenario changes.
  useEffect(() => { const orig = ws.setDemoScenario; ws.setDemoScenario = (v) => { orig?.(v); force((n) => n + 1); }; }, [ws]);
  return <WorkspaceContext.Provider value={ws}>{children}</WorkspaceContext.Provider>;
}

function LiveShell({ children }: { children: ReactNode }) {
  const { user, sites, loading, updateSite } = useAuth();
  const loc = useLocation();
  const site = sites[0];
  const ws = useMemo(() => (site ? createLiveWorkspace(site, updateSite) : null), [site, updateSite]);
  if (loading) return <div className="container section"><Loading label="Signing you in" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (!ws) return <div className="container section"><Loading label="Loading your home" /></div>;
  return <WorkspaceContext.Provider value={ws}>{children}</WorkspaceContext.Provider>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="features" element={<Features />} />
        <Route path="internet-doctor" element={<InternetDoctorPage />} />
        <Route path="home-security" element={<HomeSecurityPage />} />
        <Route path="scam-shield" element={<ScamShieldPage />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<Faq />} />
        <Route path="docs" element={<Docs />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/demo/*" element={<DemoShell><Routes><Route element={<AppLayout />}><Route path="*" element={<AppRoutes />} /></Route></Routes></DemoShell>} />
      <Route path="/app/setup" element={<LiveShell><Onboarding /></LiveShell>} />
      <Route path="/app/*" element={<LiveShell><Routes><Route element={<AppLayout />}><Route path="*" element={<AppRoutes />} /></Route></Routes></LiveShell>} />
    </Routes>
  );
}

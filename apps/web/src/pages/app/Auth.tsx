import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Banner, Button, Field, Logo } from '../../components/ui';
import { useAuth } from '../../lib/hooks';
import { ApiError } from '../../lib/api';

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="auth-wrap">
      <main id="main" className="card auth-card">
        <Link to="/" aria-label="NetShield home"><Logo /></Link>
        <h1 style={{ fontSize: '1.8rem', marginTop: 20 }}>{title}</h1>
        <p className="muted">{sub}</p>
        {children}
      </main>
    </div>
  );
}

export function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/app" replace />;
  const from = (loc.state as { from?: string } | null)?.from ?? '/app';
  return (
    <Shell title="Welcome back" sub="Sign in to see how your home is doing.">
      <form onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(null);
        try { await login(email, password); nav(from, { replace: true }); }
        catch (x) { setErr(x instanceof ApiError ? x.message : 'Could not sign in.'); setBusy(false); }
      }}>
        {err && <div style={{ marginBottom: 16 }}><Banner tone="danger" role="alert"><p>{err}</p></Banner></div>}
        <Field label="Email">{(p) => <input {...p} className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Field label="Password">{(p) => <input {...p} className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}</Field>
        <Button type="submit" block busy={busy}>Sign in</Button>
      </form>
      <p className="faint" style={{ marginTop: 16 }}>Forgot your password? Password reset needs an email service, which isn&apos;t set up in this version. <Link to="/contact">Contact us</Link> for help.</p>
      <p style={{ marginBottom: 0 }}>New here? <Link to="/register">Create an account</Link> or <Link to="/demo">try the demo</Link>.</p>
    </Shell>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ displayName: '', email: '', password: '', householdName: '' });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/app" replace />;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  function validate() {
    const e: Record<string, string> = {};
    if (!f.displayName.trim()) e.displayName = 'Please tell us what to call you.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.';
    if (f.password.length < 10) e.password = 'Use at least 10 characters. A few random words work well.';
    setErrs(e);
    return Object.keys(e).length === 0;
  }
  return (
    <Shell title="Create your account" sub="Free during the preview. No payment details needed.">
      <form noValidate onSubmit={async (e) => {
        e.preventDefault(); setErr(null);
        if (!validate()) return;
        setBusy(true);
        try { await register({ ...f, householdName: f.householdName || undefined }); nav('/app/setup', { replace: true }); }
        catch (x) { setErr(x instanceof ApiError ? x.message : 'Could not create the account.'); setBusy(false); }
      }}>
        {err && <div style={{ marginBottom: 16 }}><Banner tone="danger" role="alert"><p>{err}</p></Banner></div>}
        <Field label="Your name" error={errs.displayName}>{(p) => <input {...p} className="input" autoComplete="name" value={f.displayName} onChange={set('displayName')} />}</Field>
        <Field label="Email" error={errs.email}>{(p) => <input {...p} className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} />}</Field>
        <Field label="Password" hint="At least 10 characters." error={errs.password}>{(p) => <input {...p} className="input" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} />}</Field>
        <Field label="Name your home (optional)">{(p) => <input {...p} className="input" placeholder="e.g. The Garcia home" value={f.householdName} onChange={set('householdName')} />}</Field>
        <Button type="submit" block busy={busy}>Create account</Button>
      </form>
      <p className="faint" style={{ marginTop: 16 }}>By continuing you agree to the draft <Link to="/terms">terms</Link> and <Link to="/privacy">privacy notice</Link>.</p>
      <p style={{ marginBottom: 0 }}>Already have an account? <Link to="/login">Sign in</Link>. Or <Link to="/demo">explore the demo</Link> first.</p>
    </Shell>
  );
}

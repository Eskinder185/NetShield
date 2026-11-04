import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import App from '../App';
import { AuthProvider } from '../lib/hooks';
import { createDemoWorkspace } from '../demo/demoWorkspace';
import { timeAgo, fmtMs } from '../lib/plain';

function mount(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider><App /></AuthProvider>
    </MemoryRouter>,
  );
}

async function a11y(container: HTMLElement) {
  // color-contrast needs real layout; it is covered by the browser-based audit instead.
  const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 80)).join(' | ')}`);
}

beforeEach(() => {
  // No backend in unit tests: /api/auth/me → 401 so the user is signed out.
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'no' }), { status: 401 })));
  HTMLDialogElement.prototype.showModal = HTMLDialogElement.prototype.showModal ?? function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = HTMLDialogElement.prototype.close ?? function (this: HTMLDialogElement) { this.removeAttribute('open'); };
});

describe('helpers', () => {
  it('formats time and latency', () => {
    expect(timeAgo(null)).toBe('never');
    expect(timeAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5 min ago');
    expect(fmtMs(null)).toBe('no data');
    expect(fmtMs(12.4)).toBe('12 ms');
  });
});

describe('demo workspace', () => {
  it('is synthetic, isolated, and device edits close the matching alert', async () => {
    const ws = createDemoWorkspace();
    expect((await ws.getDiagnosis()).source).toBe('DEMO_SYNTHETIC');
    const before = (await ws.getFindings()).filter((f) => f.status === 'OPEN').length;
    expect(before).toBeGreaterThan(0);
    await ws.updateDevice('d4', { trust: 'KNOWN', displayName: 'Guest phone' });
    expect((await ws.getFindings()).filter((f) => f.status === 'OPEN').length).toBe(before - 1);
    await ws.updateDevice('d4', { trust: 'UNKNOWN' });
    expect((await ws.getFindings()).filter((f) => f.status === 'OPEN').length).toBe(before);
  });

  it('never marks a protection item verified because the user ticked it', async () => {
    const ws = createDemoWorkspace();
    await ws.markProtection('wps_off', true);
    const p = await ws.getProtection();
    expect(p.verifiedCount).toBe(0);
    expect(p.items.every((i) => !i.verified)).toBe(true);
    expect(p.items.find((i) => i.key === 'wps_off')?.status).toBe('SELF_REPORTED');
  });
});

describe('public site', () => {
  it('home page explains the product, has working CTAs, and passes axe', async () => {
    const { container } = mount('/');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/internet/i);
    expect(screen.getAllByRole('link', { name: /try the (interactive )?demo/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/fully protected/i)).toBeNull();
    expect(await a11y(container)).toEqual([]);
  });

  it.each(['/features', '/pricing', '/how-it-works', '/faq', '/docs', '/about', '/contact', '/privacy', '/terms', '/security', '/internet-doctor', '/home-security', '/scam-shield'])(
    '%s renders with a heading and passes axe', async (path) => {
      const { container } = mount(path);
      expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(await a11y(container)).toEqual([]);
    });

  it('pricing is labelled preview and has no purchasable plan', async () => {
    mount('/pricing');
    expect((await screen.findAllByText(/preview/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /not available yet/i }).every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });

  it('legal pages are labelled drafts', async () => {
    mount('/privacy');
    expect(await screen.findByText(/not reviewed/i)).toBeInTheDocument();
  });

  it('FAQ items expand and collapse accessibly', async () => {
    mount('/faq');
    const btn = await screen.findByRole('button', { name: /do i need to install anything/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('contact form never claims to have sent anything', async () => {
    mount('/contact');
    expect(await screen.findByText(/no message is sent/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^send/i })).toBeNull();
  });

  it('unknown routes show a helpful 404', async () => {
    mount('/nope/nothing');
    expect(await screen.findByText(/can't find that page/i)).toBeInTheDocument();
  });
});

describe('demo app', () => {
  it('dashboard is clearly labelled demo and passes axe', async () => {
    const { container } = mount('/demo');
    expect((await screen.findAllByText(/demo/i)).length).toBeGreaterThan(0);
    expect(await screen.findByRole('heading', { level: 2, name: /websites are having trouble loading/i }, { timeout: 3000 })).toBeInTheDocument();
    expect(await a11y(container)).toEqual([]);
  });

  it('Internet Doctor runs the symptom → result → fix → verified flow', async () => {
    const user = userEvent.setup();
    mount('/demo/internet-doctor');
    await user.click(await screen.findByRole('button', { name: /websites won't load/i }));
    expect(await screen.findByRole('heading', { name: /websites are having trouble loading/i }, { timeout: 3000 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /help me fix this/i }));
    await user.click(await screen.findByRole('button', { name: /check if it worked/i }));
    expect(await screen.findByText(/confirmed: it looks fixed/i, undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText(/scripted demo result/i)).toBeInTheDocument();
  });

  it('insufficient-evidence scenario says it cannot tell instead of guessing', async () => {
    const user = userEvent.setup();
    mount('/demo/internet-doctor');
    await user.click(await screen.findByRole('button', { name: /not enough data yet/i }));
    await user.click(screen.getByRole('button', { name: /i'm not sure/i }));
    expect(await screen.findByRole('heading', { name: /don't have enough measurements/i }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /help me fix this/i })).toBeNull();
  });

  it('technical details are hidden until requested', async () => {
    const user = userEvent.setup();
    mount('/demo/internet-doctor');
    await user.click(await screen.findByRole('button', { name: /websites won't load/i }));
    await screen.findByRole('heading', { name: /websites are having trouble loading/i }, { timeout: 3000 });
    expect(screen.queryByText(/Gateway checks use a TCP connection/i)).toBeNull();
    await user.click(screen.getByRole('button', { name: /show technical details/i }));
    expect(screen.getByText(/Gateway checks use a TCP connection/i)).toBeInTheDocument();
  });

  it('devices: identifying an unknown device updates its state', async () => {
    const user = userEvent.setup();
    mount('/demo/devices');
    const buttons = await screen.findAllByRole('button', { name: /help me identify this/i }, { timeout: 3000 });
    await user.click(buttons[0]);
    const dialog = await screen.findByRole('dialog', { hidden: true });
    await user.type(within(dialog).getByLabelText('Name'), 'Guest tablet');
    await user.selectOptions(within(dialog).getByLabelText(/do you recognize it/i), 'GUEST');
    await user.click(within(dialog).getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText('Guest tablet')).toBeInTheDocument());
  });

  it('protection checklist: ticking records a self-report, never "Verified"', async () => {
    const user = userEvent.setup();
    mount('/demo/protection');
    const box = await screen.findByRole('checkbox', { name: /turn off wps/i }, { timeout: 3000 });
    await user.click(box);
    await waitFor(() => expect(screen.getByText(/0 of 7/)).toBeInTheDocument());
    expect(screen.queryByText(/^Verified$/)).toBeNull();
    expect((await screen.findAllByText(/you say done/i)).length).toBe(1);
  });

  it('family controls are disabled with an explanation, not faked', async () => {
    mount('/demo/family');
    const boxes = await screen.findAllByRole('checkbox');
    expect(boxes.every((b) => (b as HTMLInputElement).disabled)).toBe(true);
    expect(screen.getAllByText(/needs a compatible router/i).length).toBeGreaterThan(0);
  });

  it('privacy page says there is no NetShield VPN service', async () => {
    mount('/demo/privacy');
    expect(await screen.findByText(/doesn't provide a VPN service/i)).toBeInTheDocument();
  });

  it('assistant answers from check results and states it is not AI', async () => {
    const user = userEvent.setup();
    mount('/demo/assistant');
    expect(await screen.findByText(/isn't a chatbot/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /websites won't load/i }));
    expect(await screen.findByText(/synthetic demo data/i, undefined, { timeout: 3000 })).toBeInTheDocument();
  });

  it.each(['/demo/protection', '/demo/devices', '/demo/scam-shield', '/demo/family', '/demo/privacy', '/demo/reports', '/demo/assistant', '/demo/lab', '/demo/settings'])(
    '%s passes axe', async (path) => {
      const { container } = mount(path);
      await screen.findByRole('heading', { level: 1 }, { timeout: 3000 });
      await waitFor(() => expect(container.querySelector('[role="status"] .skeleton')).toBeNull(), { timeout: 3000 });
      expect(await a11y(container)).toEqual([]);
    });
});

describe('live area', () => {
  it('redirects signed-out visitors to login', async () => {
    mount('/app/devices');
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('login shows a clear error on failure and password reset is honest', async () => {
    const user = userEvent.setup();
    mount('/login');
    await user.type(await screen.findByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/password reset needs an email service/i)).toBeInTheDocument();
  });

  it('register validates fields with specific messages', async () => {
    const user = userEvent.setup();
    mount('/register');
    await user.click(await screen.findByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/tell us what to call you/i)).toBeInTheDocument();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 10 characters\. a few/i)).toBeInTheDocument();
  });
});

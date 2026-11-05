import type {
  CoverageLayer, Device, DevicePatch, Diagnosis, Finding, FindingStatus, HelperAuditEvent, HelperInvitation, HelperNote, HelperSession, ProtectionItem, Retest, ScamCase, ScamIncidentType, Sensor, SiteSettings, Stats, Verdict,
} from '../lib/types';
import type { Workspace } from '../lib/workspace';

/**
 * SYNTHETIC DEMO DATA. Everything here is invented for demonstration, labelled as such in the UI, held only in
 * browser memory, and never sent to or read from the NetShield API.
 */
const now = () => new Date().toISOString();
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

const DEMO_COVERAGE: CoverageLayer[] = [
  { key: 'router', title: 'Router configuration', state: 'STATUS_UNKNOWN', known: 'No router settings can be verified.', blindSpot: 'No compatible router integration is connected.', nextStep: 'Review router settings using the checklist.', lastObservedAt: null },
  { key: 'wifi', title: 'Wi-Fi network', state: 'STATUS_UNKNOWN', known: 'The demo sensor checks its path to the router.', blindSpot: 'Wi-Fi security and other devices are not inspected.', nextStep: 'Review Wi-Fi settings in your router.', lastObservedAt: ago(1) },
  { key: 'dns_filtering', title: 'DNS filtering', state: 'NOT_CONFIGURED', known: 'Website-name lookups are measured.', blindSpot: 'No domains are blocked.', nextStep: 'Consider a filtering service if needed.', lastObservedAt: ago(1) },
  { key: 'devices', title: 'Known connected devices', state: 'MONITORING_AVAILABLE', known: 'The demo sensor shows five invented devices.', blindSpot: 'Passive inventory cannot find every device.', nextStep: 'Review unfamiliar devices.', lastObservedAt: ago(1) },
  { key: 'endpoints', title: 'Computers with endpoint support', state: 'UNSUPPORTED', known: 'No endpoint agent is installed.', blindSpot: 'Malware status cannot be verified.', nextStep: 'Use built-in device security tools.', lastObservedAt: null },
  { key: 'smart_home', title: 'Smart-home devices', state: 'STATUS_UNKNOWN', known: 'Some demo devices are observed.', blindSpot: 'Firmware and traffic are not inspected.', nextStep: 'Check updates in device maker apps.', lastObservedAt: ago(1) },
  { key: 'family', title: 'Family protection settings', state: 'NOT_CONFIGURED', known: 'No family filtering integration is connected.', blindSpot: 'Content restrictions are not enforced.', nextStep: 'Review device or router controls.', lastObservedAt: null },
  { key: 'vpn', title: 'VPN coverage', state: 'UNSUPPORTED', known: 'NetShield provides no VPN tunnel.', blindSpot: 'VPN status cannot be inferred.', nextStep: 'Use a trusted VPN if needed.', lastObservedAt: null },
  { key: 'browser', title: 'Browser protection', state: 'UNSUPPORTED', known: 'The link checker analyzes pasted text.', blindSpot: 'Browser traffic is not inspected.', nextStep: 'Keep browser protection enabled.', lastObservedAt: null },
  { key: 'monitoring', title: 'Security monitoring', state: 'MONITORING_AVAILABLE', known: 'Demo device observations can flag unfamiliar devices.', blindSpot: 'No full threat detection is present.', nextStep: 'Review open alerts.', lastObservedAt: ago(1) },
  { key: 'diagnostics', title: 'Network diagnostics', state: 'MONITORING_AVAILABLE', known: 'Demo checks are synthetic.', blindSpot: 'They say nothing about your real network.', nextStep: 'Try Internet Doctor.', lastObservedAt: ago(1) },
];

const DEMO_SCAM_STEPS: Record<ScamIncidentType, [string, string][]> = {
  LINK: [['Close the page', 'Do not enter information. If you did, start the matching recovery case.']],
  PASSWORD: [['Open the official service directly', 'Do not return through the suspicious link.'], ['Change the exposed password', 'Use a new unique password, and change it anywhere else you reused it.'], ['Review sessions and recovery settings', 'Sign out unfamiliar sessions and check recovery information.'], ['Turn on two-step sign-in', 'Use a passkey or authenticator app where available.']],
  PERSONAL_INFO: [['Identify what was shared', 'Write it down privately outside NetShield.'], ['Watch for misuse', 'Review relevant accounts and identity-protection resources.']],
  MONEY: [['Contact your provider now', 'Use the number on your card or the official app. Ask about stopping or disputing payment.'], ['Review account activity', 'Check transactions through the official provider.']],
  DOWNLOAD: [['Do not open the file', 'If installed, disconnect the device until it is checked.'], ['Use trusted device protection', 'Run a built-in security scan and review recent installations.']],
  IMPERSONATION: [['Contact the real organization', 'Use its official site or a known phone number.']],
  DELIVERY: [['Check delivery directly', 'Open the carrier app or official site yourself.']],
  ACCOUNT_ACCESS: [['Secure the account', 'Change the password, end unfamiliar sessions, enable two-step sign-in.'], ['Review recent changes', 'Check purchases, messages and recovery settings.']],
};

const s = (count: number, loss: number, med: number | null, jit: number | null): Stats => ({ count, lossPct: loss, medianMs: med, jitterMs: jit });

const SCENARIOS: Record<Verdict, Omit<Diagnosis, 'windowStart' | 'windowEnd' | 'source' | 'sensorOnline'>> = {
  HEALTHY: {
    verdict: 'HEALTHY', confidence: 'MEDIUM', sampleCount: 60,
    headline: 'Your internet looks normal in recent checks.',
    explanation: 'Router, website lookups and outside destinations all responded normally in the samples collected. This describes the sampled period only; it is not a guarantee about other times or other devices.',
    action: 'Nothing to fix right now.',
    evidence: { GATEWAY: s(15, 0, 2.4, 0.6), DNS: s(15, 0, 21, 3), PUBLIC_IP: s(15, 0, 14, 1.2), PUBLIC_HTTP: s(15, 0, 48, 6) },
  },
  DNS_FAILURE: {
    verdict: 'DNS_FAILURE', confidence: 'HIGH', sampleCount: 60,
    headline: 'Websites are having trouble loading.',
    explanation: "Your router is reachable and the internet itself responds, but 87% of website-name lookups failed. The service that helps your devices find websites isn't answering.",
    action: "Restart your router, or switch your router's DNS setting to a different provider, then re-test.",
    evidence: { GATEWAY: s(15, 0, 2.5, 0.7), DNS: s(15, 87, null, null), PUBLIC_IP: s(15, 0, 15, 1.1), PUBLIC_HTTP: s(15, 40, 52, 9) },
  },
  GATEWAY_ISSUE: {
    verdict: 'GATEWAY_ISSUE', confidence: 'HIGH', sampleCount: 60,
    headline: 'Your device is struggling to reach your router.',
    explanation: 'About 40% of checks to your router failed. That points to Wi-Fi, cabling or the router itself rather than your internet provider.',
    action: 'Move closer to the router or use a cable, then restart the router and re-test.',
    evidence: { GATEWAY: s(15, 40, 38, 61), DNS: s(15, 20, 90, 70), PUBLIC_IP: s(15, 33, 80, 66), PUBLIC_HTTP: s(15, 33, 140, 90) },
  },
  UPSTREAM_ISSUE: {
    verdict: 'UPSTREAM_ISSUE', confidence: 'MEDIUM', sampleCount: 60,
    headline: "Your home network is fine, but the internet beyond it isn't responding.",
    explanation: 'Your router answered, but every outside destination we tried failed. This usually means an outage or fault with your internet provider.',
    action: 'Restart the modem, wait two minutes, and re-test. If it persists, contact your provider with the evidence report.',
    evidence: { GATEWAY: s(15, 0, 2.2, 0.5), DNS: s(15, 20, 300, 120), PUBLIC_IP: s(15, 100, null, null), PUBLIC_HTTP: s(15, 100, null, null) },
  },
  REMOTE_ENDPOINT_ISSUE: {
    verdict: 'REMOTE_ENDPOINT_ISSUE', confidence: 'MEDIUM', sampleCount: 60,
    headline: 'Only some websites are failing.',
    explanation: "Your connection works for most destinations. https://shop.example.test failed in our checks, which suggests the problem is on that service's side.",
    action: 'Wait a while and try again; there is nothing to fix at home.',
    evidence: { GATEWAY: s(15, 0, 2.3, 0.4), DNS: s(15, 0, 20, 3), PUBLIC_IP: s(15, 0, 14, 1), PUBLIC_HTTP: s(15, 50, 60, 10) },
  },
  ELEVATED_JITTER: {
    verdict: 'ELEVATED_JITTER', confidence: 'MEDIUM', sampleCount: 60,
    headline: 'Your internet is responding unevenly.',
    explanation: 'The delay to your own router varies a lot, which is typical of Wi-Fi interference or a busy network. This can make video calls freeze and games lag even when speeds look fine.',
    action: 'Try a cable or move closer to the router, and pause large downloads, then re-test.',
    evidence: { GATEWAY: s(15, 0, 9, 52), DNS: s(15, 0, 40, 33), PUBLIC_IP: s(15, 0, 30, 41), PUBLIC_HTTP: s(15, 0, 80, 44) },
  },
  INSUFFICIENT_EVIDENCE: {
    verdict: 'INSUFFICIENT_EVIDENCE', confidence: 'LOW', sampleCount: 3,
    headline: "We don't have enough measurements yet.",
    explanation: 'At least 5 recent checks of your router, website lookups and the wider internet are needed before NetShield will name a cause.',
    action: 'Leave the sensor running for a few minutes, then run the check again.',
    evidence: { GATEWAY: s(3, 0, 2.5, 0.5), DNS: s(2, 0, 22, 2) },
  },
};

export const SCENARIO_LABELS: Record<Verdict, string> = {
  HEALTHY: 'Everything normal',
  DNS_FAILURE: 'Websites not loading (DNS)',
  GATEWAY_ISSUE: 'Trouble reaching the router',
  UPSTREAM_ISSUE: 'Internet provider outage',
  REMOTE_ENDPOINT_ISSUE: 'One website is down',
  ELEVATED_JITTER: 'Uneven, laggy connection',
  INSUFFICIENT_EVIDENCE: 'Not enough data yet',
};

const PROTECTION: ProtectionItem[] = [
  ['router_admin_password', 'Change the router\'s default admin password', 'Default passwords are widely known; anyone on your Wi-Fi could change your router\'s settings.', 'Open your router\'s settings page (often printed on the router label), find Administration, and set a long unique password.', 'HIGH'],
  ['wifi_wpa', 'Use WPA2 or WPA3 for Wi-Fi', 'Older Wi-Fi security can be broken quickly, exposing everything on your network.', 'In your router\'s Wi-Fi settings, set security to WPA3 or WPA2-AES.', 'HIGH'],
  ['remote_admin_off', 'Turn off remote administration', "It lets the router's settings be reached from the internet.", 'In router settings, disable Remote Management / Remote Access.', 'HIGH'],
  ['wps_off', 'Turn off WPS', 'WPS PIN setup has known weaknesses.', 'In Wi-Fi settings, disable WPS.', 'MEDIUM'],
  ['router_firmware', 'Keep router firmware up to date', 'Updates fix security flaws.', "Check your router's Administration or Firmware page, or the maker's support site.", 'MEDIUM'],
  ['guest_network', 'Put visitors and smart-home gadgets on a guest network', 'Limits what a compromised gadget can reach.', 'Enable Guest Wi-Fi in router settings and move TVs, cameras and visitors to it.', 'LOW'],
  ['mfa_enabled', 'Turn on two-step sign-in for email and banking', 'Stops most account takeovers even if a password leaks.', "Enable two-step verification (an authenticator app or passkey) in each account's security settings.", 'HIGH'],
].map(([key, title, why, how, severity]) => ({
  key, title, why, how, severity: severity as ProtectionItem['severity'], selfReportedDone: false, verified: false,
  status: 'UNVERIFIED' as const, verificationNote: "NetShield can't check this automatically yet; it needs a compatible router integration.",
}));

export function createDemoWorkspace(): Workspace {
  let scenario: Verdict = 'DNS_FAILURE';
  let settings: SiteSettings = { name: 'Demo home', retentionDays: 30, consentDeviceInventory: true };
  let sensors: Sensor[] = [{ id: 'demo-sensor', name: 'Demo sensor (synthetic)', status: 'ONLINE', createdAt: ago(60 * 24 * 3), pairedAt: ago(60 * 24 * 3), lastHeartbeatAt: ago(1), expiresAt: ago(-60 * 24 * 80), agentVersion: 'demo' }];
  const dev = (id: string, name: string | null, host: string, ip: string, vendor: string | null, rand: boolean, trust: Device['trust'], room: string | null, owner: string | null, firstMin: number): Device => ({
    id, display_name: name, hostname: host, ip_address: ip, vendor_guess: vendor, vendor_confidence: vendor ? 'LOW' : 'NONE', mac_randomized: rand,
    trust, room, owner, first_seen_at: ago(firstMin), last_seen_at: ago(rand ? 3 : 1),
  });
  let devices: Device[] = [
    dev('d1', 'Living room TV', 'living-room-tv', '192.168.1.21', 'Example TV maker', false, 'KNOWN', 'Living room', 'Everyone', 60 * 24 * 30),
    dev('d2', "Sam's laptop", 'sam-laptop', '192.168.1.34', null, true, 'KNOWN', 'Office', 'Sam', 60 * 24 * 30),
    dev('d3', 'Kitchen speaker', 'smart-speaker', '192.168.1.40', 'Example audio maker', false, 'KNOWN', 'Kitchen', 'Everyone', 60 * 24 * 12),
    dev('d4', null, 'unknown-device', '192.168.1.57', null, true, 'UNKNOWN', null, null, 38),
    dev('d5', null, '', '192.168.1.61', 'Example IoT module', false, 'UNKNOWN', null, null, 140),
  ];
  let findings: Finding[] = [
    { id: 'f1', device_id: 'd4', category: 'UNKNOWN_DEVICE', title: "A device we don't recognize appeared on your network", severity: 'MEDIUM', confidence: 'LOW', status: 'OPEN',
      evidence: 'First seen 38 minutes ago at address 192.168.1.57. It uses a private (randomized) hardware address, so its maker cannot be identified and it may reappear as a "new" device when it rejoins.',
      recommendation: 'Check whether this is a phone, TV or guest device you know. If it is, mark it as known; if not, change your Wi-Fi password.', created_at: ago(38), updated_at: ago(38) },
    { id: 'f2', device_id: 'd5', category: 'UNKNOWN_DEVICE', title: "A device we don't recognize appeared on your network", severity: 'MEDIUM', confidence: 'MEDIUM', status: 'OPEN',
      evidence: 'First seen 2 hours ago at address 192.168.1.61. Maker guess: Example IoT module (low confidence, from the address prefix).',
      recommendation: 'Check whether this is a phone, TV or guest device you know. If it is, mark it as known; if not, change your Wi-Fi password.', created_at: ago(140), updated_at: ago(140) },
  ];
  let protection = PROTECTION.map((p) => ({ ...p }));
  let incident: { id: string; before: Verdict } | null = null;
  let scamCases: ScamCase[] = [];
  let helperInvites: HelperInvitation[] = [];
  let helperSessions: HelperSession[] = [];
  let helperNotes: Record<string, HelperNote[]> = {};
  let helperAudit: HelperAuditEvent[] = [];
  let latestHelperToken = '';
  const logHelper = (action: string, detail: string, actor = 'Demo owner') => {
    helperAudit = [{ actor, action, detail, created_at: now() }, ...helperAudit];
  };
  const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));

  const diag = (v: Verdict): Diagnosis => ({
    ...SCENARIOS[v], windowStart: ago(15), windowEnd: now(), source: 'DEMO_SYNTHETIC', sensorOnline: true,
  });

  const w: Workspace = {
    mode: 'demo', basePath: '/demo', siteName: 'Demo home', siteRole: 'OWNER',
    get settings() { return settings; },
    get demoScenario() { return scenario; },
    setDemoScenario(v) { scenario = v; },
    getSensors: () => wait({ sensors: [...sensors], anyOnline: true }),
    enroll: (name) => {
      const id = 'demo-' + (sensors.length + 1);
      sensors = [...sensors, { id, name, status: 'WAITING_TO_PAIR', createdAt: now(), pairedAt: null, lastHeartbeatAt: null, expiresAt: ago(-60 * 24 * 7), agentVersion: null }];
      return wait({ sensorId: id, token: 'nsh_DEMO_TOKEN_NOT_REAL_do_not_use', expiresAt: ago(-60 * 24 * 7) });
    },
    revoke: async (id) => { sensors = sensors.map((x) => (x.id === id ? { ...x, status: 'REVOKED' } : x)); await wait(0); },
    getDiagnosis: () => wait(diag(scenario)),
    recordDiagnosis: () => {
      incident = { id: 'demo-incident-' + Date.now(), before: scenario };
      return wait({ ...diag(scenario), incidentId: incident.id });
    },
    retest: (): Promise<Retest> => {
      // Synthetic: the demo pretends the user applied the fix, so the scenario becomes healthy. Clearly labelled in the UI.
      const before = incident?.before ?? scenario;
      scenario = 'HEALTHY';
      return wait({ outcome: before === 'HEALTHY' ? 'VERIFIED' : 'VERIFIED', beforeVerdict: before, afterVerdict: 'HEALTHY',
        detail: 'Demo only: this result is scripted to show what a verified fix looks like. Real retests only report improvement when new measurements show it.',
        beforeEvidence: SCENARIOS[before].evidence, beforeWindowStart: ago(15), beforeWindowEnd: ago(5), verifiedAt: now(), after: diag('HEALTHY') });
    },
    getHistory: () => wait([
      { id: 'h1', verdict: 'DNS_FAILURE' as Verdict, summary: 'Websites are having trouble loading.', created_at: ago(60 * 26) },
      { id: 'h2', verdict: 'ELEVATED_JITTER' as Verdict, summary: 'Your internet is responding unevenly.', created_at: ago(60 * 24 * 4) },
    ]),
    getDevices: () => wait({ consented: true, devices: [...devices], note: 'Demo devices are synthetic. Real inventories only list devices a consented sensor has observed.' }),
    updateDevice: async (id, p: DevicePatch) => {
      devices = devices.map((d) => (d.id === id ? { ...d, display_name: p.displayName ?? d.display_name, room: p.room ?? d.room, owner: p.owner ?? d.owner, trust: p.trust } : d));
      findings = findings.map((f) => (f.device_id === id && f.category === 'UNKNOWN_DEVICE'
        ? { ...f, status: p.trust === 'UNKNOWN' ? (f.status === 'RESOLVED' ? 'OPEN' : f.status) : 'RESOLVED', updated_at: now() } : f));
      await wait(0);
    },
    getFindings: () => wait([...findings]),
    setFinding: async (id, st: FindingStatus) => { findings = findings.map((f) => (f.id === id ? { ...f, status: st, updated_at: now() } : f)); await wait(0); },
    getProtection: () => wait({ items: protection.map((p) => ({ ...p })), verifiedCount: 0, total: protection.length }),
    getCoverage: () => wait({ layers: DEMO_COVERAGE.map((layer) => ({ ...layer })), assessedAt: now(), sensorOnline: true }),
    getReliability: (days) => wait({ requestedStart: ago(days * 24 * 60), requestedEnd: now(), observedStart: ago(90), observedEnd: ago(1), sampleCount: 50,
      truncated: false, source: 'DEMO_SYNTHETIC',
      methodology: 'Synthetic five-minute groups for demonstration. Missing periods are unknown, not uptime; this is not evidence about your connection.',
      periods: [
        { status: 'DNS_FAILURE_OBSERVED', start: ago(90), end: ago(85), sampleCount: 20, explanation: 'Synthetic website-name lookup failures while direct checks worked.' },
        { status: 'MONITORING_GAP', start: ago(85), end: ago(10), sampleCount: 0, explanation: 'No measurements in this synthetic period; connection status is unknown.' },
        { status: 'NORMAL_CHECKS_OBSERVED', start: ago(10), end: ago(1), sampleCount: 30, explanation: 'Synthetic sampled checks succeeded; other times are unknown.' },
      ] }),
    getHelperInvitations: () => wait(helperInvites.map((h) => ({ ...h }))),
    createHelperInvitation: () => {
      const id = `demo-helper-${Date.now()}`;
      latestHelperToken = 'nshh_' + '0'.repeat(64);
      const inviteExpiresAt = ago(-24 * 60);
      helperInvites = [{ id, scope: 'DIAGNOSTIC_SUMMARY', created_at: now(), invite_expires_at: inviteExpiresAt,
        accepted_at: null, session_expires_at: null, revoked_at: null, helper_email: null }, ...helperInvites];
      logHelper('HELPER_INVITED', id);
      return wait({ id, token: latestHelperToken, scope: 'DIAGNOSTIC_SUMMARY' as const, inviteExpiresAt });
    },
    revokeHelperInvitation: async (id) => { helperInvites = helperInvites.map((h) => h.id === id ? { ...h, revoked_at: now() } : h); helperSessions = helperSessions.filter((h) => h.id !== id); logHelper('HELPER_REVOKED', id); await wait(0); },
    getOwnerHelperNotes: (id) => wait([...(helperNotes[id] ?? [])]),
    getHelperAudit: () => wait(helperAudit.map((e) => ({ ...e }))),
    acceptHelperInvitation: async (token) => {
      const h = helperInvites.find((item) => !item.revoked_at && !item.accepted_at && token === latestHelperToken);
      if (!h) throw new Error('Invitation invalid or already used.');
      h.accepted_at = now(); h.session_expires_at = ago(-120); h.helper_email = 'demo-helper@example.com';
      helperSessions = [{ id: h.id, scope: 'DIAGNOSTIC_SUMMARY', accepted_at: h.accepted_at, session_expires_at: h.session_expires_at, site_name: 'Demo home' }, ...helperSessions];
      logHelper('HELPER_ACCEPTED', h.id, 'Demo helper');
      await wait(0);
    },
    getHelperSessions: () => wait(helperSessions.map((h) => ({ ...h }))),
    getHelperWorkspace: (id) => {
      if (!helperSessions.some((h) => h.id === id)) return Promise.reject(new Error('Session expired or revoked.'));
      logHelper('HELPER_SUMMARY_VIEWED', id, 'Demo helper');
      return wait({ id, siteName: 'Demo home', scope: 'DIAGNOSTIC_SUMMARY' as const, diagnosis: diag(scenario),
        history: [{ id: 'demo-history', verdict: scenario, summary: SCENARIOS[scenario].headline, created_at: ago(60) }], notes: [...(helperNotes[id] ?? [])] });
    },
    addHelperNote: (id, body) => {
      if (!helperSessions.some((h) => h.id === id)) return Promise.reject(new Error('Session expired or revoked.'));
      const note = { id: `demo-note-${Date.now()}`, body, created_at: now(), author: 'Demo helper' };
      helperNotes[id] = [...(helperNotes[id] ?? []), note];
      logHelper('HELPER_NOTE_ADDED', id, 'Demo helper');
      return wait([...helperNotes[id]]);
    },
    getScamCases: () => wait(scamCases.map(({ id, incident_type, created_at, updated_at }) => ({ id, incident_type, created_at, updated_at }))),
    startScamCase: (type) => {
      const stamp = now();
      const steps = [...DEMO_SCAM_STEPS[type], ['Keep a record', 'Save messages and dates privately outside NetShield.'], ['Report the attempt', 'Report it in the service where it arrived.']]
        .map(([title, guidance], n) => ({ step_key: `step_${n}`, title, guidance, done: false, completed_at: null }));
      const c: ScamCase = { id: `demo-case-${Date.now()}`, incident_type: type, created_at: stamp, updated_at: stamp, steps, evidenceLevel: 'USER_REPORTED_ONLY' };
      scamCases = [c, ...scamCases];
      return wait({ ...c, steps: [...c.steps] });
    },
    getScamCase: (id) => {
      const c = scamCases.find((item) => item.id === id);
      return c ? wait({ ...c, steps: [...c.steps] }) : Promise.reject(new Error('Case not found'));
    },
    setScamStep: (id, key, done) => {
      scamCases = scamCases.map((c) => c.id !== id ? c : { ...c, updated_at: now(), steps: c.steps.map((step) => step.step_key === key ? { ...step, done, completed_at: done ? now() : null } : step) });
      const c = scamCases.find((item) => item.id === id);
      return c ? wait({ ...c, steps: [...c.steps] }) : Promise.reject(new Error('Case not found'));
    },
    deleteScamCase: async (id) => { scamCases = scamCases.filter((c) => c.id !== id); await wait(0); },
    markProtection: async (key, done) => {
      protection = protection.map((p) => (p.key === key ? { ...p, selfReportedDone: done, status: done ? 'SELF_REPORTED' : 'UNVERIFIED' } : p));
      await wait(0);
    },
    saveSettings: async (v) => { settings = v; await wait(0); },
    deleteData: async () => { devices = []; findings = []; scamCases = []; helperInvites = []; helperSessions = []; helperNotes = {}; helperAudit = []; await wait(0); },
  };
  return w;
}

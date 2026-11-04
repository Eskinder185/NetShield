import type {
  Device, DevicePatch, Diagnosis, Finding, FindingStatus, ProtectionItem, Retest, Sensor, SiteSettings, Stats, Verdict,
} from '../lib/types';
import type { Workspace } from '../lib/workspace';

/**
 * SYNTHETIC DEMO DATA. Everything here is invented for demonstration, labelled as such in the UI, held only in
 * browser memory, and never sent to or read from the NetShield API.
 */
const now = () => new Date().toISOString();
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

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
  const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));

  const diag = (v: Verdict): Diagnosis => ({
    ...SCENARIOS[v], windowStart: ago(15), windowEnd: now(), source: 'DEMO_SYNTHETIC', sensorOnline: true,
  });

  const w: Workspace = {
    mode: 'demo', basePath: '/demo', siteName: 'Demo home',
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
        detail: 'Demo only: this result is scripted to show what a verified fix looks like. Real retests only report improvement when new measurements show it.', after: diag('HEALTHY') });
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
    markProtection: async (key, done) => {
      protection = protection.map((p) => (p.key === key ? { ...p, selfReportedDone: done, status: done ? 'SELF_REPORTED' : 'UNVERIFIED' } : p));
      await wait(0);
    },
    saveSettings: async (v) => { settings = v; await wait(0); },
    deleteData: async () => { devices = []; findings = []; await wait(0); },
  };
  return w;
}

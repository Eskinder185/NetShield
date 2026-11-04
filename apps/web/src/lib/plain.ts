import type { SensorStatus, Trust, Verdict } from './types';

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';

/** Plain-English labels. Technical terms live only inside "Show technical details". */
export const VERDICT_META: Record<Verdict, { tone: Tone; label: string; technical: string }> = {
  HEALTHY: { tone: 'ok', label: 'Working normally', technical: 'No rule fired: gateway, DNS and public endpoints within thresholds.' },
  DNS_FAILURE: { tone: 'danger', label: "Websites won't load", technical: 'DNS lookups failing (>=50%) while direct-IP connectivity succeeds and the gateway is reachable.' },
  GATEWAY_ISSUE: { tone: 'danger', label: 'Trouble reaching your router', technical: 'Gateway TCP reachability loss >= 20%.' },
  UPSTREAM_ISSUE: { tone: 'danger', label: 'Provider problem likely', technical: 'Gateway OK, DNS OK, all public targets failing (>=50% loss each).' },
  REMOTE_ENDPOINT_ISSUE: { tone: 'warn', label: 'One website is down', technical: 'Some, not all, public HTTP targets failing; gateway and DNS healthy.' },
  ELEVATED_JITTER: { tone: 'warn', label: 'Uneven connection', technical: 'Mean absolute successive latency difference >= 30 ms.' },
  INSUFFICIENT_EVIDENCE: { tone: 'neutral', label: 'Not enough information', technical: 'Fewer than 5 samples for gateway, DNS or public targets, or sensor offline.' },
};

export const KIND_LABEL: Record<string, string> = {
  GATEWAY: 'Your router',
  DNS: 'Website lookups',
  PUBLIC_IP: 'The wider internet (direct)',
  PUBLIC_HTTP: 'Popular websites',
};

export const SENSOR_META: Record<SensorStatus, { tone: Tone; label: string; help: string }> = {
  ONLINE: { tone: 'ok', label: 'Online', help: 'Sending measurements right now.' },
  OFFLINE: { tone: 'warn', label: 'Offline', help: 'Not heard from recently. Results below may be out of date.' },
  WAITING_TO_PAIR: { tone: 'info', label: 'Waiting to connect', help: 'Start the sensor with this sensor\'s token to finish pairing.' },
  REVOKED: { tone: 'neutral', label: 'Disconnected', help: 'This sensor was removed and can no longer send data.' },
  EXPIRED: { tone: 'neutral', label: 'Expired', help: 'The setup token expired before the sensor connected. Create a new one.' },
};

export const TRUST_LABEL: Record<Trust, string> = { UNKNOWN: 'Not yet identified', KNOWN: 'Mine / known', GUEST: 'Guest', BLOCKED: 'Don\'t trust' };

export const SEVERITY: Record<string, { tone: Tone; label: string }> = {
  HIGH: { tone: 'danger', label: 'Needs attention' },
  MEDIUM: { tone: 'warn', label: 'Worth checking' },
  LOW: { tone: 'info', label: 'Good to do' },
  INFO: { tone: 'neutral', label: 'For your information' },
};

export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return 'never';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
}

export function fmtMs(v: number | null | undefined): string {
  return v === null || v === undefined ? 'no data' : `${v < 10 ? v.toFixed(1) : Math.round(v)} ms`;
}

export type Verdict =
  | 'HEALTHY' | 'GATEWAY_ISSUE' | 'DNS_FAILURE' | 'UPSTREAM_ISSUE'
  | 'REMOTE_ENDPOINT_ISSUE' | 'ELEVATED_JITTER' | 'INSUFFICIENT_EVIDENCE';

export interface Stats { count: number; lossPct: number; medianMs: number | null; jitterMs: number | null }

export interface Diagnosis {
  verdict: Verdict;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  headline: string;
  explanation: string;
  action: string;
  evidence: Record<string, Stats>;
  windowStart: string;
  windowEnd: string;
  sampleCount: number;
  sensorOnline: boolean;
  source: 'LIVE_SENSOR_MEASUREMENTS' | 'DEMO_SYNTHETIC';
  incidentId?: string;
}

export interface Retest {
  outcome: 'VERIFIED' | 'NOT_IMPROVED' | 'INCONCLUSIVE';
  beforeVerdict: Verdict;
  afterVerdict: Verdict;
  detail: string;
  after: Diagnosis;
}

export type SensorStatus = 'WAITING_TO_PAIR' | 'ONLINE' | 'OFFLINE' | 'REVOKED' | 'EXPIRED';
export interface Sensor {
  id: string; name: string; status: SensorStatus; createdAt: string; pairedAt: string | null;
  lastHeartbeatAt: string | null; expiresAt: string; agentVersion: string | null;
}
export interface SensorsResponse { sensors: Sensor[]; anyOnline: boolean }
export interface Enrollment { sensorId: string; token: string; expiresAt: string }

export type Trust = 'UNKNOWN' | 'KNOWN' | 'GUEST' | 'BLOCKED';
export interface Device {
  id: string; ip_address: string | null; hostname: string | null; vendor_guess: string | null;
  vendor_confidence: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'; mac_randomized: boolean;
  display_name: string | null; room: string | null; owner: string | null; trust: Trust;
  first_seen_at: string; last_seen_at: string;
}
export interface DevicesResponse { consented: boolean; devices: Device[]; note: string }
export interface DevicePatch { displayName?: string | null; room?: string | null; owner?: string | null; trust: Trust }

export type FindingStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export interface Finding {
  id: string; device_id: string | null; category: string; title: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH'; confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  status: FindingStatus; evidence: string; recommendation: string; created_at: string; updated_at: string;
}

export interface ProtectionItem {
  key: string; title: string; why: string; how: string; severity: 'LOW' | 'MEDIUM' | 'HIGH';
  selfReportedDone: boolean; verified: boolean; status: 'UNVERIFIED' | 'SELF_REPORTED' | 'VERIFIED'; verificationNote: string;
}
export interface ProtectionResponse { items: ProtectionItem[]; verifiedCount: number; total: number }

export interface SiteSettings { name: string; retentionDays: number; consentDeviceInventory: boolean }

export interface UrlSignal { code: string; title: string; detail: string; weight: number }
export interface UrlResult {
  level: 'MALFORMED' | 'SUSPICIOUS' | 'CAUTION' | 'NO_WARNING_SIGNS';
  headline: string; summary: string; host: string | null; signals: UrlSignal[]; limits: string;
}

export interface SiteView {
  id: string; householdId: string; householdName: string; name: string; role: string;
  retentionDays: number; consentDeviceInventory: boolean;
}
export interface User { id: string; email: string; displayName: string }

export interface HistoryItem { id: string; verdict: Verdict; summary: string; created_at: string }

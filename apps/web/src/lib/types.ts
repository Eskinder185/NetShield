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
  observationSpanSeconds?: Record<string, number>;
  sensorOnline: boolean;
  source: 'LIVE_SENSOR_MEASUREMENTS' | 'DEMO_SYNTHETIC';
  incidentId?: string;
}

export interface Retest {
  outcome: 'VERIFIED' | 'NOT_IMPROVED' | 'INCONCLUSIVE';
  beforeVerdict: Verdict;
  afterVerdict: Verdict;
  detail: string;
  beforeEvidence?: Record<string, Stats>;
  beforeWindowStart?: string;
  beforeWindowEnd?: string;
  verifiedAt?: string;
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

export type CoverageState = 'PROTECTION_VERIFIED_ACTIVE' | 'MONITORING_AVAILABLE' | 'ACTION_REQUIRED' | 'NOT_CONFIGURED' | 'UNSUPPORTED' | 'STATUS_UNKNOWN' | 'TEMPORARILY_UNAVAILABLE';
export interface CoverageLayer { key: string; title: string; state: CoverageState; known: string; blindSpot: string; nextStep: string; lastObservedAt: string | null }
export interface CoverageResponse { layers: CoverageLayer[]; assessedAt: string; sensorOnline: boolean }

export type ScamIncidentType = 'LINK' | 'PASSWORD' | 'PERSONAL_INFO' | 'MONEY' | 'DOWNLOAD' | 'IMPERSONATION' | 'DELIVERY' | 'ACCOUNT_ACCESS';
export interface ScamCaseSummary { id: string; incident_type: ScamIncidentType; created_at: string; updated_at: string }
export interface ScamStep { step_key: string; title: string; guidance: string; done: boolean; completed_at: string | null }
export interface ScamCase extends ScamCaseSummary { steps: ScamStep[]; evidenceLevel: 'USER_REPORTED_ONLY' }

export type ReliabilityStatus = 'NORMAL_CHECKS_OBSERVED' | 'LOCAL_FAILURE_OBSERVED' | 'DNS_FAILURE_OBSERVED' | 'OUTSIDE_FAILURE_OBSERVED' | 'PARTIAL_OR_MIXED' | 'MONITORING_GAP';
export interface ReliabilityPeriod { status: ReliabilityStatus; start: string; end: string; sampleCount: number; explanation: string }
export interface ReliabilityReport { requestedStart: string; requestedEnd: string; observedStart: string | null; observedEnd: string | null; sampleCount: number; truncated: boolean; periods: ReliabilityPeriod[]; methodology: string; source: 'LIVE_SENSOR_MEASUREMENTS' | 'DEMO_SYNTHETIC' }

export interface HelperInvitation { id: string; scope: 'DIAGNOSTIC_SUMMARY'; created_at: string; invite_expires_at: string; accepted_at: string | null; session_expires_at: string | null; revoked_at: string | null; helper_email: string | null }
export interface HelperInviteCreated { id: string; token: string; scope: 'DIAGNOSTIC_SUMMARY'; inviteExpiresAt: string }
export interface HelperSession { id: string; scope: 'DIAGNOSTIC_SUMMARY'; accepted_at: string; session_expires_at: string; site_name: string }
export interface HelperNote { id: string; body: string; created_at: string; author: string }
export interface HelperWorkspace { id: string; siteName: string; scope: 'DIAGNOSTIC_SUMMARY'; diagnosis: Diagnosis; history: HistoryItem[]; notes: HelperNote[] }
export interface HelperAuditEvent { actor: string; action: string; detail: string; created_at: string }

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

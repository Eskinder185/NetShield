import type {
  CoverageResponse, Diagnosis, HistoryItem, DevicePatch, DevicesResponse, Enrollment, Finding, FindingStatus, HelperAuditEvent, HelperInvitation, HelperInviteCreated, HelperNote, HelperSession, HelperWorkspace, ProtectionResponse, ReliabilityReport, Retest, ScamCase, ScamCaseSummary, ScamIncidentType,
  SensorsResponse, SiteSettings, SiteView, UrlResult, User,
} from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function cookie(name: string): string | null {
  const m = document.cookie.split('; ').find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.split('=')[1]) : null;
}

async function csrfToken(): Promise<string> {
  let t = cookie('XSRF-TOKEN');
  if (!t) {
    await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    t = cookie('XSRF-TOKEN');
  }
  return t ?? '';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-XSRF-TOKEN'] = await csrfToken();
  let res: Response;
  try {
    res = await fetch(path, { method, headers, credentials: 'same-origin', body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'Cannot reach the NetShield server. Is it running?');
  }
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).error ?? msg; } catch { /* non-JSON error */ }
    throw new ApiError(res.status, msg);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const s = (id: string) => `/api/sites/${id}`;

export const api = {
  register: (b: { email: string; displayName: string; password: string; householdName?: string }) => request<User>('POST', '/api/auth/register', b),
  login: (b: { email: string; password: string }) => request<User>('POST', '/api/auth/login', b),
  logout: () => request<{ ok: boolean }>('POST', '/api/auth/logout'),
  me: () => request<User>('GET', '/api/auth/me'),
  sites: () => request<SiteView[]>('GET', '/api/sites'),
  saveSettings: (id: string, b: SiteSettings) => request<{ ok: boolean }>('PUT', `${s(id)}/settings`, b),
  sensors: (id: string) => request<SensorsResponse>('GET', `${s(id)}/sensors`),
  enroll: (id: string, name: string) => request<Enrollment>('POST', `${s(id)}/sensors`, { name }),
  revoke: (id: string, sensorId: string) => request<{ ok: boolean }>('DELETE', `${s(id)}/sensors/${sensorId}`),
  diagnosis: (id: string) => request<Diagnosis>('GET', `${s(id)}/diagnosis`),
  recordDiagnosis: (id: string) => request<Diagnosis>('POST', `${s(id)}/diagnosis`),
  history: (id: string) => request<HistoryItem[]>('GET', `${s(id)}/diagnosis/history`),
  retest: (id: string, incident: string) => request<Retest>('POST', `${s(id)}/diagnosis/${incident}/retest`),
  devices: (id: string) => request<DevicesResponse>('GET', `${s(id)}/devices`),
  updateDevice: (id: string, dev: string, p: DevicePatch) => request<{ ok: boolean }>('PATCH', `${s(id)}/devices/${dev}`, p),
  findings: (id: string) => request<Finding[]>('GET', `${s(id)}/findings`),
  setFinding: (id: string, f: string, status: FindingStatus) => request<{ ok: boolean }>('PATCH', `${s(id)}/findings/${f}`, { status }),
  protection: (id: string) => request<ProtectionResponse>('GET', `${s(id)}/protection`),
  coverage: (id: string) => request<CoverageResponse>('GET', `${s(id)}/coverage`),
  reliability: (id: string, days: 1 | 7 | 30) => request<ReliabilityReport>('GET', `${s(id)}/reliability?days=${days}`),
  helperInvitations: (id: string) => request<HelperInvitation[]>('GET', `${s(id)}/helpers`),
  createHelperInvitation: (id: string) => request<HelperInviteCreated>('POST', `${s(id)}/helpers`),
  revokeHelperInvitation: (id: string, inviteId: string) => request<{ ok: boolean }>('DELETE', `${s(id)}/helpers/${inviteId}`),
  ownerHelperNotes: (id: string, inviteId: string) => request<HelperNote[]>('GET', `${s(id)}/helpers/${inviteId}/notes`),
  helperAudit: (id: string) => request<HelperAuditEvent[]>('GET', `${s(id)}/helpers/audit`),
  acceptHelperInvitation: (token: string) => request<{ id: string }>('POST', '/api/helpers/accept', { token }),
  helperSessions: () => request<HelperSession[]>('GET', '/api/helpers/sessions'),
  helperWorkspace: (id: string) => request<HelperWorkspace>('GET', `/api/helpers/sessions/${id}`),
  addHelperNote: (id: string, body: string) => request<HelperNote[]>('POST', `/api/helpers/sessions/${id}/notes`, { body }),
  scamCases: (id: string) => request<ScamCaseSummary[]>('GET', `${s(id)}/scam-rescue`),
  startScamCase: (id: string, type: ScamIncidentType) => request<ScamCase>('POST', `${s(id)}/scam-rescue`, { type }),
  scamCase: (id: string, caseId: string) => request<ScamCase>('GET', `${s(id)}/scam-rescue/${caseId}`),
  setScamStep: (id: string, caseId: string, key: string, done: boolean) => request<ScamCase>('PUT', `${s(id)}/scam-rescue/${caseId}/steps/${key}`, { done }),
  deleteScamCase: (id: string, caseId: string) => request<{ ok: boolean }>('DELETE', `${s(id)}/scam-rescue/${caseId}`),
  scamExportUrl: (id: string, caseId: string) => `${s(id)}/scam-rescue/${caseId}/export`,
  markProtection: (id: string, key: string, done: boolean) => request<{ ok: boolean }>('PUT', `${s(id)}/protection/${key}`, { done }),
  deleteData: (id: string) => request<Record<string, number>>('DELETE', `${s(id)}/data`),
  deleteAccount: (password: string) => request<{ ok: boolean }>('DELETE', '/api/account', { password }),
  inspectUrl: (url: string) => request<UrlResult>('POST', '/api/scam/inspect', { url }),
  exportUrl: (id: string) => `${s(id)}/export`,
  csvUrl: (id: string) => `${s(id)}/export/measurements.csv`,
};

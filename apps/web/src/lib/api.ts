import type {
  Diagnosis, HistoryItem, DevicePatch, DevicesResponse, Enrollment, Finding, FindingStatus, ProtectionResponse, Retest,
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
  markProtection: (id: string, key: string, done: boolean) => request<{ ok: boolean }>('PUT', `${s(id)}/protection/${key}`, { done }),
  deleteData: (id: string) => request<Record<string, number>>('DELETE', `${s(id)}/data`),
  deleteAccount: (password: string) => request<{ ok: boolean }>('DELETE', '/api/account', { password }),
  inspectUrl: (url: string) => request<UrlResult>('POST', '/api/scam/inspect', { url }),
  exportUrl: (id: string) => `${s(id)}/export`,
  csvUrl: (id: string) => `${s(id)}/export/measurements.csv`,
};

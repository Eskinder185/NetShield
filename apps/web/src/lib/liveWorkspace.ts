import { api } from './api';
import type { SiteView } from './types';
import type { Workspace } from './workspace';

/** Real workspace backed by the Spring Boot API. Every call is scoped to one site the signed-in user belongs to. */
export function createLiveWorkspace(site: SiteView, onSettings: (s: SiteView) => void): Workspace {
  const id = site.id;
  const w: Workspace = {
    mode: 'live', basePath: '/app', siteName: site.name,
    settings: { name: site.name, retentionDays: site.retentionDays, consentDeviceInventory: site.consentDeviceInventory },
    exportJsonUrl: api.exportUrl(id), exportCsvUrl: api.csvUrl(id),
    getSensors: () => api.sensors(id),
    enroll: (name) => api.enroll(id, name),
    revoke: async (sid) => { await api.revoke(id, sid); },
    getDiagnosis: () => api.diagnosis(id),
    recordDiagnosis: () => api.recordDiagnosis(id),
    retest: (inc) => api.retest(id, inc),
    getHistory: () => api.history(id),
    getDevices: () => api.devices(id),
    updateDevice: async (d, p) => { await api.updateDevice(id, d, p); },
    getFindings: () => api.findings(id),
    setFinding: async (f, st) => { await api.setFinding(id, f, st); },
    getProtection: () => api.protection(id),
    markProtection: async (k, d) => { await api.markProtection(id, k, d); },
    saveSettings: async (s) => { await api.saveSettings(id, s); onSettings({ ...site, ...s }); },
    deleteData: async () => { await api.deleteData(id); },
  };
  return w;
}

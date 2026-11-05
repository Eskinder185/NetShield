import { createContext, useContext } from 'react';
import type {
  CoverageResponse, Diagnosis, DevicePatch, DevicesResponse, Enrollment, Finding, FindingStatus, HelperAuditEvent, HelperInvitation, HelperInviteCreated, HelperNote, HelperSession, HelperWorkspace, ProtectionResponse, ReliabilityReport, Retest, ScamCase, ScamCaseSummary, ScamIncidentType,
  SensorsResponse, SiteSettings, Verdict, HistoryItem,
} from './types';

/**
 * One interface, two implementations. Pages never know which they are talking to except through `mode`,
 * which drives the unmistakable "Demo: synthetic data" labelling. Demo data never reaches the API and live data never mixes in.
 */
export interface Workspace {
  mode: 'demo' | 'live';
  basePath: '/demo' | '/app';
  siteName: string;
  siteRole: string;
  settings: SiteSettings;
  getSensors(): Promise<SensorsResponse>;
  enroll(name: string): Promise<Enrollment>;
  revoke(sensorId: string): Promise<void>;
  getDiagnosis(): Promise<Diagnosis>;
  recordDiagnosis(): Promise<Diagnosis>;
  retest(incidentId: string): Promise<Retest>;
  getHistory(): Promise<HistoryItem[]>;
  getDevices(): Promise<DevicesResponse>;
  updateDevice(id: string, p: DevicePatch): Promise<void>;
  getFindings(): Promise<Finding[]>;
  setFinding(id: string, s: FindingStatus): Promise<void>;
  getProtection(): Promise<ProtectionResponse>;
  getCoverage(): Promise<CoverageResponse>;
  getReliability(days: 1 | 7 | 30): Promise<ReliabilityReport>;
  getHelperInvitations(): Promise<HelperInvitation[]>;
  createHelperInvitation(): Promise<HelperInviteCreated>;
  revokeHelperInvitation(id: string): Promise<void>;
  getOwnerHelperNotes(id: string): Promise<HelperNote[]>;
  getHelperAudit(): Promise<HelperAuditEvent[]>;
  acceptHelperInvitation(token: string): Promise<void>;
  getHelperSessions(): Promise<HelperSession[]>;
  getHelperWorkspace(id: string): Promise<HelperWorkspace>;
  addHelperNote(id: string, body: string): Promise<HelperNote[]>;
  getScamCases(): Promise<ScamCaseSummary[]>;
  startScamCase(type: ScamIncidentType): Promise<ScamCase>;
  getScamCase(id: string): Promise<ScamCase>;
  setScamStep(id: string, key: string, done: boolean): Promise<ScamCase>;
  deleteScamCase(id: string): Promise<void>;
  scamExportUrl?(id: string): string;
  markProtection(key: string, done: boolean): Promise<void>;
  saveSettings(s: SiteSettings): Promise<void>;
  deleteData(): Promise<void>;
  exportJsonUrl?: string;
  exportCsvUrl?: string;
  /** Demo only: switch the synthetic scenario so every diagnosis outcome can be explored. */
  demoScenario?: Verdict;
  setDemoScenario?(v: Verdict): void;
}

export const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspace(): Workspace {
  const w = useContext(WorkspaceContext);
  if (!w) throw new Error('useWorkspace must be used inside a workspace provider');
  return w;
}

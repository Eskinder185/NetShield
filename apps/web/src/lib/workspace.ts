import { createContext, useContext } from 'react';
import type {
  Diagnosis, DevicePatch, DevicesResponse, Enrollment, Finding, FindingStatus, ProtectionResponse, Retest,
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

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, ApiError } from './api';
import type { SiteView, User } from './types';

/* ---------- async data ---------- */
export interface Async<T> { data: T | null; error: string | null; loading: boolean; reload: () => void; setData: (v: T) => void }

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): Async<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let live = true;
    setLoading(true);
    fnRef.current().then(
      (v) => { if (live) { setData(v); setError(null); setLoading(false); } },
      (e) => { if (live) { setError(e instanceof ApiError ? e.message : 'Something went wrong.'); setLoading(false); } },
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);
  return { data, error, loading, reload: useCallback(() => setTick((t) => t + 1), []), setData };
}

/* ---------- theme ---------- */
export type ThemeChoice = 'dark' | 'light' | 'system';
export function useTheme(): [ThemeChoice, (t: ThemeChoice) => void] {
  const [t, setT] = useState<ThemeChoice>(() => (localStorage.getItem('ns-theme') as ThemeChoice) || 'system');
  const set = (v: ThemeChoice) => {
    setT(v);
    if (v === 'system') { localStorage.removeItem('ns-theme'); delete document.documentElement.dataset.theme; }
    else { localStorage.setItem('ns-theme', v); document.documentElement.dataset.theme = v; }
  };
  return [t, set];
}

/* ---------- auth ---------- */
interface AuthState {
  user: User | null; sites: SiteView[]; loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(b: { email: string; displayName: string; password: string; householdName?: string }): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  updateSite(s: SiteView): void;
}
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sites, setSites] = useState<SiteView[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
      setSites(await api.sites());
    } catch {
      setUser(null); setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const value: AuthState = {
    user, sites, loading, refresh,
    login: async (email, password) => { await api.login({ email, password }); await refresh(); },
    register: async (b) => { await api.register(b); await refresh(); },
    logout: async () => { await api.logout(); setUser(null); setSites([]); },
    updateSite: (s) => setSites((l) => l.map((x) => (x.id === s.id ? s : x))),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}

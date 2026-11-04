import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, HelpCircle, Laptop, Search, ShieldQuestion, Tv } from 'lucide-react';
import { Banner, Button, Dialog, EmptyState, ErrorState, Field, LinkButton, Loading, Pill, TechDetails } from '../../components/ui';
import { useAsync } from '../../lib/hooks';
import { useWorkspace } from '../../lib/workspace';
import { TRUST_LABEL, timeAgo } from '../../lib/plain';
import type { Device, Trust } from '../../lib/types';

const FILTERS = [{ id: 'all', label: 'All' }, { id: 'UNKNOWN', label: 'Not yet identified' }, { id: 'KNOWN', label: 'Mine / known' }, { id: 'GUEST', label: 'Guests' }];

function iconFor(d: Device) {
  const n = `${d.display_name ?? ''} ${d.hostname ?? ''}`.toLowerCase();
  if (/tv|speaker|echo|cast/.test(n)) return Tv;
  if (/laptop|pc|phone|ipad|mac/.test(n)) return Laptop;
  return d.trust === 'UNKNOWN' ? ShieldQuestion : Cpu;
}

export function Devices() {
  const ws = useWorkspace();
  const state = useAsync(() => ws.getDevices(), [ws]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Device | null>(null);

  const list = useMemo(() => (state.data?.devices ?? []).filter((d) => (filter === 'all' || d.trust === filter)
    && `${d.display_name ?? ''} ${d.hostname ?? ''} ${d.ip_address ?? ''} ${d.room ?? ''} ${d.owner ?? ''}`.toLowerCase().includes(q.toLowerCase())), [state.data, filter, q]);

  if (state.loading) return <Loading />;
  if (state.error || !state.data) return <ErrorState message={state.error ?? ''} onRetry={state.reload} />;
  const { consented, devices } = state.data;
  const unknown = devices.filter((d) => d.trust === 'UNKNOWN').length;

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">My Devices</h1>
        <p className="muted">The phones, TVs, computers and gadgets NetShield has noticed on your network.</p>
      </div>

      {!consented && (
        <Banner tone="info" title="Device checking is turned off">
          <p>NetShield only looks for devices if you say it can. When it&apos;s on, your home sensor reads the list of devices its own computer has recently talked to. It doesn&apos;t scan your network or capture traffic.</p>
          <LinkButton to={`${ws.basePath}/settings`} size="sm" variant="secondary">Turn on in Settings</LinkButton>
        </Banner>
      )}
      <Banner tone="info"><p>{state.data.note}</p></Banner>

      {unknown > 0 && <Banner tone="warn" title={`${unknown} ${unknown === 1 ? 'device' : 'devices'} we don't recognize`} role="status">
        <p>Open each one and tell us what it is. If you can&apos;t tell, changing your Wi-Fi password is a safe way to kick off anything unknown.</p></Banner>}

      <div className="row-between">
        <div className="chips" role="group" aria-label="Filter devices">
          {FILTERS.map((f) => <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>)}
        </div>
        <div style={{ position: 'relative', minWidth: 240 }}>
          <label htmlFor="dev-search" className="sr-only">Search devices</label>
          <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: 14, top: 15, color: 'var(--text-faint)' }} />
          <input id="dev-search" className="input" style={{ paddingLeft: 38 }} placeholder="Search by name, room, owner…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {devices.length === 0 ? (
        <EmptyState icon={Laptop} title="No devices yet"
          action={consented ? undefined : <LinkButton to={`${ws.basePath}/settings`}>Turn on device checking</LinkButton>}>
          <p>{consented ? 'Nothing has been reported yet. Make sure your sensor is running with device checking enabled.' : 'Device checking is off, so NetShield isn\'t looking for devices.'}</p>
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState icon={Search} title="No matches"><p>No devices match that filter or search.</p></EmptyState>
      ) : (
        <ul className="grid grid-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {list.map((d) => {
            const Icon = iconFor(d);
            return (
              <li key={d.id} style={{ margin: 0 }}><article className="card device-card" aria-label={d.display_name || d.hostname || 'Unnamed device'}>
                <div className="device-top">
                  <div className="device-icon"><Icon size={22} aria-hidden="true" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="card-title" style={{ margin: 0 }}>{d.display_name || d.hostname || 'Unnamed device'}</h2>
                    <p className="faint" style={{ margin: 0 }}>{[d.room, d.owner].filter(Boolean).join(' · ') || 'No room or owner set'}</p>
                  </div>
                  <Pill tone={d.trust === 'UNKNOWN' ? 'warn' : d.trust === 'BLOCKED' ? 'danger' : 'ok'}>{TRUST_LABEL[d.trust]}</Pill>
                </div>
                <p className="faint" style={{ margin: 0 }}>Last seen {timeAgo(d.last_seen_at)}</p>
                <div className="row">
                  <Button size="sm" variant={d.trust === 'UNKNOWN' ? 'primary' : 'secondary'} onClick={() => setEditing(d)}>{d.trust === 'UNKNOWN' ? 'Help me identify this' : 'View and edit'}</Button>
                </div>
              </article></li>
            );
          })}
        </ul>
      )}

      {editing && <EditDialog key={editing.id} device={editing} onClose={() => setEditing(null)} onSave={async (p) => { await ws.updateDevice(editing.id, p); setEditing(null); state.reload(); }} />}
      <p className="faint"><Link to={`${ws.basePath}/protection`}>See security items for these devices →</Link></p>
    </div>
  );
}

function EditDialog({ device: d, onClose, onSave }: { device: Device; onClose: () => void; onSave: (p: { displayName: string | null; room: string | null; owner: string | null; trust: Trust }) => Promise<void> }) {
  const [name, setName] = useState(d.display_name ?? '');
  const [room, setRoom] = useState(d.room ?? '');
  const [owner, setOwner] = useState(d.owner ?? '');
  const [trust, setTrust] = useState<Trust>(d.trust);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Dialog open onClose={onClose} title={d.display_name || d.hostname || 'This device'}>
      <form onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(null);
        try { await onSave({ displayName: name.trim() || null, room: room.trim() || null, owner: owner.trim() || null, trust }); }
        catch (x) { setErr(x instanceof Error ? x.message : 'Could not save'); setBusy(false); }
      }}>
        <Field label="Name">{(p) => <input {...p} className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitchen tablet" />}</Field>
        <div className="grid grid-2">
          <Field label="Room">{(p) => <input {...p} className="input" value={room} maxLength={60} onChange={(e) => setRoom(e.target.value)} />}</Field>
          <Field label="Whose is it?">{(p) => <input {...p} className="input" value={owner} maxLength={60} onChange={(e) => setOwner(e.target.value)} />}</Field>
        </div>
        <Field label="Do you recognize it?" hint="Marking a device as known or guest closes its “unknown device” alert. You can change this later.">
          {(p) => (
            <select {...p} className="select" value={trust} onChange={(e) => setTrust(e.target.value as Trust)}>
              {(Object.keys(TRUST_LABEL) as Trust[]).map((t) => <option key={t} value={t}>{TRUST_LABEL[t]}</option>)}
            </select>
          )}
        </Field>
        <TechDetails label="what we actually know">
          <ul style={{ marginBottom: 0 }}>
            <li><HelpCircle size={14} aria-hidden="true" /> Address on your network: {d.ip_address ?? 'unknown'}</li>
            <li>Network name it announced: {d.hostname || 'none'}</li>
            <li>Maker: {d.vendor_guess ? `${d.vendor_guess} (${d.vendor_confidence.toLowerCase()} confidence, guessed from its hardware address)` : 'unknown'}</li>
            <li>{d.mac_randomized ? 'Uses a private (randomized) hardware address. Phones do this on purpose for privacy, so the same phone can look like a new device on rejoin.' : 'Uses its real hardware address.'}</li>
            <li>First seen {timeAgo(d.first_seen_at)}; last seen {timeAgo(d.last_seen_at)}.</li>
          </ul>
        </TechDetails>
        {err && <p className="error-text" role="alert">{err}</p>}
        <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy}>Save</Button>
        </div>
      </form>
    </Dialog>
  );
}

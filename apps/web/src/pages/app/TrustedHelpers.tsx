import { useState } from 'react';
import { KeyRound, Users } from 'lucide-react';
import { Banner, Button, EmptyState, ErrorState, Field, Loading, Pill } from '../../components/ui';
import { useAsync } from '../../lib/hooks';
import { useWorkspace } from '../../lib/workspace';
import { VERDICT_META } from '../../lib/plain';
import type { HelperInviteCreated, HelperNote, HelperWorkspace } from '../../lib/types';

const ACTION_LABEL: Record<string, string> = {
  HELPER_INVITED: 'Invitation created', HELPER_ACCEPTED: 'Invitation accepted',
  HELPER_SUMMARY_VIEWED: 'Diagnostic summary viewed', HELPER_NOTE_ADDED: 'Suggestion added',
  HELPER_REVOKED: 'Access revoked',
};

export function TrustedHelpers() {
  const ws = useWorkspace();
  const owner = ws.siteRole === 'OWNER';
  const invitations = useAsync(() => owner ? ws.getHelperInvitations() : Promise.resolve([]), [ws, owner]);
  const audit = useAsync(() => owner ? ws.getHelperAudit() : Promise.resolve([]), [ws, owner]);
  const sessions = useAsync(() => ws.getHelperSessions(), [ws]);
  const [created, setCreated] = useState<HelperInviteCreated | null>(null);
  const [code, setCode] = useState('');
  const [workspace, setWorkspace] = useState<HelperWorkspace | null>(null);
  const [ownerNotes, setOwnerNotes] = useState<HelperNote[] | null>(null);
  const [note, setNote] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function act(fn: () => Promise<void>) {
    setBusy(true); setError(null); setNotice(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'The request failed.'); } finally { setBusy(false); }
  }
  function makeInvite() { void act(async () => { setCreated(await ws.createHelperInvitation()); invitations.reload(); audit.reload(); }); }
  function accept() { void act(async () => { await ws.acceptHelperInvitation(code.trim()); setCode(''); sessions.reload(); invitations.reload(); audit.reload(); setNotice('Invitation accepted. Your access is read-only and expires after two hours.'); }); }
  function revoke(id: string) { void act(async () => { await ws.revokeHelperInvitation(id); setConfirmRevoke(null); setCreated(null); invitations.reload(); audit.reload(); if (workspace?.id === id) setWorkspace(null); setNotice('Access revoked immediately.'); }); }
  function openSession(id: string) { void act(async () => { setWorkspace(await ws.getHelperWorkspace(id)); audit.reload(); }); }
  function addNote() { if (!workspace || !note.trim()) return; void act(async () => {
    const notes = await ws.addHelperNote(workspace.id, note.trim());
    setWorkspace({ ...workspace, notes }); setNote(''); audit.reload(); setNotice('Suggestion saved for the owner.');
  }); }
  function showOwnerNotes(id: string) { void act(async () => { setOwnerNotes(await ws.getOwnerHelperNotes(id)); }); }

  return <div className="stack">
    <div><h1 className="page-title">Trusted helpers</h1>
      <p className="muted">Let someone you trust see a limited internet diagnostic summary for a short time.</p></div>
    <Banner tone="info" title="You control access"><p>Invitations work once and expire after 24 hours. Accepted access lasts two hours, is read-only, and can be revoked immediately. Helpers cannot access your devices, router, account settings, or operating system. Suggestions are visible to the owner.</p></Banner>
    {ws.mode === 'demo' && <Banner tone="demo"><p>Invitations and helper sessions here are synthetic and stay in this browser tab.</p></Banner>}
    {error && <ErrorState message={error} />}{notice && <Banner tone="ok" role="status"><p>{notice}</p></Banner>}

    {owner && <section className="card stack" aria-labelledby="invite-h">
      <h2 id="invite-h" style={{ fontSize: '1.4rem' }}>Share your diagnostic summary</h2>
      <p className="muted">Creating an invitation is your consent to share the latest Internet Doctor result, ten saved check summaries, and helper suggestions. The code is shown only once. Share it with your helper through a channel you trust.</p>
      <div><Button icon={KeyRound} busy={busy} onClick={makeInvite}>Create one-time invitation</Button></div>
      {created && <Field label="One-time invitation code" hint={`Expires ${new Date(created.inviteExpiresAt).toLocaleString()}. This code will not be shown again.`}>
        {(p) => <input {...p} className="input" value={created.token} readOnly onFocus={(e) => e.target.select()} />}
      </Field>}
      <h3>Access and invitations</h3>
      {invitations.loading ? <Loading label="Loading invitations" /> : invitations.error ? <ErrorState message={invitations.error} onRetry={invitations.reload} /> : invitations.data?.length ? <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
        {invitations.data.map((invite) => {
          const status = invite.revoked_at ? 'Revoked' : invite.accepted_at ? new Date(invite.session_expires_at!).getTime() > Date.now() ? 'Active' : 'Expired' : new Date(invite.invite_expires_at).getTime() > Date.now() ? 'Waiting for helper' : 'Expired';
          return <li key={invite.id} className="card card-flat stack">
            <div className="row-between"><strong>{invite.helper_email ?? 'No helper accepted yet'}</strong><Pill tone={status === 'Active' ? 'info' : 'neutral'}>{status}</Pill></div>
            <p className="faint">Only diagnostic summary · {invite.accepted_at ? `Accepted ${new Date(invite.accepted_at).toLocaleString()}, access ends ${new Date(invite.session_expires_at!).toLocaleString()}` : `Invitation ends ${new Date(invite.invite_expires_at).toLocaleString()}`}</p>
            <div className="row">
              {invite.accepted_at && <Button size="sm" variant="secondary" onClick={() => showOwnerNotes(invite.id)}>View suggestions</Button>}
              {!invite.revoked_at && (confirmRevoke === invite.id ? <>
                <Button size="sm" variant="danger" busy={busy} onClick={() => revoke(invite.id)}>Confirm revoke</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmRevoke(null)}>Cancel</Button>
              </> : <Button size="sm" variant="ghost" onClick={() => setConfirmRevoke(invite.id)}>Revoke access</Button>)}
            </div>
          </li>;
        })}
      </ul> : <p className="muted">No invitations yet.</p>}
      {ownerNotes && <div className="card card-flat"><h3>Helper suggestions</h3>{ownerNotes.length ? <ul>{ownerNotes.map((item) => <li key={item.id}><strong>{item.author}</strong> · {new Date(item.created_at).toLocaleString()}: {item.body}</li>)}</ul> : <p className="muted">No suggestions yet.</p>}</div>}
      <div className="card card-flat stack"><div className="row-between"><h3 style={{ margin: 0 }}>Access activity</h3><Button size="sm" variant="ghost" onClick={audit.reload}>Refresh</Button></div>
        {audit.loading ? <Loading label="Loading access activity" /> : audit.error ? <ErrorState message={audit.error} onRetry={audit.reload} /> : audit.data?.length ? <ol>{audit.data.map((event, i) => <li key={`${event.created_at}-${i}`}>
          <strong>{ACTION_LABEL[event.action] ?? event.action}</strong> · {event.actor} · {new Date(event.created_at).toLocaleString()}
        </li>)}</ol> : <p className="muted">No helper activity yet.</p>}
      </div>
    </section>}

    <section className="card stack" aria-labelledby="accept-h">
      <h2 id="accept-h" style={{ fontSize: '1.4rem' }}>Helping someone?</h2>
      <p className="muted">Sign in to your own account and enter the one-time code they gave you. You can read only the shared diagnostic summary and leave a suggestion. You cannot make changes to their network.</p>
      <Field label="Invitation code" hint="Paste the complete code. It is used once and is not saved in your browser.">
        {(p) => <input {...p} className="input" value={code} onChange={(e) => setCode(e.target.value)} maxLength={69} autoComplete="off" spellCheck={false} />}
      </Field>
      <div><Button busy={busy} disabled={!code.trim()} onClick={accept}>Accept invitation</Button></div>
      <h3>Your active helper sessions</h3>
      {sessions.loading ? <Loading label="Loading helper sessions" /> : sessions.error ? <ErrorState message={sessions.error} onRetry={sessions.reload} /> : sessions.data?.length ? <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
        {sessions.data.map((session) => <li key={session.id} className="card card-flat row-between"><span><strong>{session.site_name}</strong><br /><span className="faint">Read-only · Expires {new Date(session.session_expires_at).toLocaleString()}</span></span>
          <Button size="sm" variant="secondary" busy={busy} onClick={() => openSession(session.id)}>Open summary</Button></li>)}
      </ul> : <EmptyState icon={Users} title="No active sessions"><p>Accepted invitations appear here until they expire or the owner revokes them.</p></EmptyState>}
    </section>

    {workspace && <section className="card stack" aria-labelledby="helper-workspace-h">
      <h2 id="helper-workspace-h" style={{ fontSize: '1.4rem' }}>Shared summary: {workspace.siteName}</h2>
      <Pill tone="info">Read-only diagnostic summary</Pill>
      <h3>Latest check</h3><p><strong>{workspace.diagnosis.headline}</strong> ({VERDICT_META[workspace.diagnosis.verdict].label})</p>
      <p>{workspace.diagnosis.explanation}</p>
      <p className="faint">{workspace.diagnosis.sampleCount} sensor checks through {new Date(workspace.diagnosis.windowEnd).toLocaleString()}; source: {workspace.diagnosis.source === 'DEMO_SYNTHETIC' ? 'synthetic demo' : 'home sensor'}.</p>
      <h3>Saved checks</h3>{workspace.history.length ? <ul>{workspace.history.map((item) => <li key={item.id}>{new Date(item.created_at).toLocaleString()}: {item.summary}</li>)}</ul> : <p className="muted">No saved checks shared.</p>}
      <h3>Suggestions</h3>{workspace.notes.length ? <ul>{workspace.notes.map((item) => <li key={item.id}><strong>{item.author}:</strong> {item.body}</li>)}</ul> : <p className="muted">No suggestions yet.</p>}
      <Field label="Suggest a safe next step" hint="Do not enter passwords, recovery codes, account numbers, or personal information.">
        {(p) => <textarea {...p} className="input" value={note} maxLength={1000} rows={3} onChange={(e) => setNote(e.target.value)} />}
      </Field>
      <div><Button busy={busy} disabled={!note.trim()} onClick={addNote}>Save suggestion</Button></div>
    </section>}
  </div>;
}

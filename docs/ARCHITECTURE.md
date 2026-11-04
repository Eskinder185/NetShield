# Architecture

```
 Browser (React SPA)                      Home computer
 ├─ public site, /demo (in-memory fixtures) └─ netshield-agent (Java, JDK only)
 └─ /app (signed in) ── same-origin /api ──┐      │ outbound HTTPS only, Bearer nsh_… token
                                            ▼      ▼
                               Spring Boot API ── /api/auth, /api/sites/**, /api/scam/inspect (cookie session + CSRF)
                                            │       /api/ingest/**                          (sensor token, no session)
                                            ▼
                                  PostgreSQL (Flyway)   [H2 in tests / `h2` profile]
```

## Modules
| Path | Purpose |
|---|---|
| `services/api` | `auth` (register/login/session, account delete), `site` (access control, settings, audit, retention), `sensor` (enrollment, token filter, ingest), `diag` (pure `DiagnosisEngine` + stored incidents/retests), `device`, `finding` (alerts, protection checklist), `scam` (`UrlInspector`), `report` (export/delete), `config` (security, errors) |
| `services/agent` | `Config` (explicit, capped), `Probes` (TCP/DNS/HTTPS-HEAD), `ArpReader` (OS neighbour cache, CIDR-filtered), `ApiClient`, `Agent` |
| `apps/web` | `components/` design system + layouts, `pages/public`, `pages/app`, `lib/` (API client, hooks, `Workspace` abstraction), `demo/` |

## Data model (why each table exists)
`users`, `households`, `household_memberships(role OWNER/MEMBER/VIEWER)` — who may see what · `sites` — a monitored network with retention + consent flags · `sensors` — enrollment doubling as credential (hash, expiry, revoke, heartbeat) · `measurements` — raw probe results · `devices` (hashed identity) · `findings` — reviewable alerts · `protection_checks` — self-reported checklist state · `incidents` + `verifications` — saved diagnoses and honest retest outcomes · `audit_events`.
Not yet present (from the spec's entity list): Network, Policy, Integration, SubscriptionEntitlement, Evidence (evidence is stored inline on findings/incidents). They have no working feature yet and were deliberately not added.

## Request/trust boundaries
- Browser → API: session cookie; every `/api/sites/{id}/**` call resolves `SiteAccess` (membership + role) first; non-members get 404.
- Agent → API: bearer token resolved to `(sensorId, siteId)`; the site id is never taken from the request body or path, so a sensor can only write its own site.
- Demo: never touches the API for data.

## Diagnosis rules (`DiagnosisEngine`)
Inputs: last 15 min of measurements. Needs ≥5 samples each for gateway, DNS and public groups, else `INSUFFICIENT_EVIDENCE`. Order: gateway loss ≥20% → `GATEWAY_ISSUE`; DNS fail ≥50% while direct-IP checks work → `DNS_FAILURE`; all public targets failing → `UPSTREAM_ISSUE`; some failing → `REMOTE_ENDPOINT_ISSUE`; jitter ≥30 ms → `ELEVATED_JITTER`; else `HEALTHY` (sample-period only). Thresholds are constants in the class and covered by tests.

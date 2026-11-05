# API quick reference

## Phase 2 additions

`GET /api/sites/{id}/reliability?days=1|7|30` returns five-minute sampled periods, explicit `MONITORING_GAP` periods, observation timestamps, a row-cap warning, and methodology. It does not attribute a fault to the ISP. The web report uses browser print for PDF saving.

Trusted Helper: owner-only `GET/POST /api/sites/{id}/helpers`, `DELETE /api/sites/{id}/helpers/{inviteId}`, `GET /api/sites/{id}/helpers/{inviteId}/notes`, and `GET /api/sites/{id}/helpers/audit`. The owner receives a 256-bit one-time invitation token only at creation. A signed-in helper calls `POST /api/helpers/accept` with `{ "token": "nshh_..." }`, then `GET /api/helpers/sessions`, `GET /api/helpers/sessions/{inviteId}`, and `POST /api/helpers/sessions/{inviteId}/notes` with `{ "body": "..." }`. The scope is fixed to `DIAGNOSTIC_SUMMARY`, with 24-hour invitation acceptance and two-hour read-only session expiry. Helper grants do not authorize any `/api/sites/{id}` route.

`GET /api/sites/{id}/coverage` returns eleven site-scoped layers with explicit `state`, `known`, `blindSpot`, `nextStep`, and optional `lastObservedAt`. A sensor heartbeat establishes monitoring availability only.

Scam Rescue uses `GET/POST /api/sites/{id}/scam-rescue`, `GET/DELETE /api/sites/{id}/scam-rescue/{caseId}`, `PUT /api/sites/{id}/scam-rescue/{caseId}/steps/{key}`, and `GET /api/sites/{id}/scam-rescue/{caseId}/export`. The start body is `{ "type": "PASSWORD" }`; accepted types are `LINK`, `PASSWORD`, `PERSONAL_INFO`, `MONEY`, `DOWNLOAD`, `IMPERSONATION`, `DELIVERY`, and `ACCOUNT_ACCESS`. Progress body is `{ "done": true }`. Writes require member or owner role. Case detail includes ordered steps and `evidenceLevel: USER_REPORTED_ONLY`. No free-text password, account, or card fields are accepted or stored.

Diagnosis retest adds saved `beforeEvidence`, `beforeWindowStart`, `beforeWindowEnd`, `verifiedAt`, and `after`. Only measurements after the saved baseline window can establish a verified recovery.

Interactive OpenAPI docs: `http://127.0.0.1:8080/api/docs` (when the API runs). All JSON. Session routes need the `XSRF-TOKEN` cookie value sent as `X-XSRF-TOKEN`.

```bash
B=http://127.0.0.1:8080; J=cookies.txt
curl -s -c $J $B/api/auth/csrf >/dev/null
X=$(grep XSRF $J | awk '{print $7}')
curl -s -c $J -b $J -H "X-XSRF-TOKEN: $X" -H 'Content-Type: application/json' \
  -X POST $B/api/auth/register -d '{"email":"me@example.com","displayName":"Me","password":"a long passphrase"}'
```

| Method & path | Auth | Notes |
|---|---|---|
| `POST /api/auth/register` · `/login` · `/logout`, `GET /api/auth/me` · `/csrf` | public / session | login limited to 5 failures per 15 min |
| `GET /api/sites` · `PUT /api/sites/{id}/settings` · `GET …/audit` | session | settings: owner only |
| `GET/POST /api/sites/{id}/sensors`, `DELETE …/{sensorId}` | session | POST returns the token once |
| `GET/POST /api/sites/{id}/diagnosis`, `POST …/{incident}/retest`, `GET …/history` | session | GET never stores; POST saves an incident |
| `GET /api/sites/{id}/devices`, `PATCH …/{deviceId}` | session | trust ∈ UNKNOWN/KNOWN/GUEST/BLOCKED |
| `GET /api/sites/{id}/findings`, `PATCH …/{id}` | session | status ∈ OPEN/ACKNOWLEDGED/RESOLVED |
| `GET /api/sites/{id}/protection`, `PUT …/{key}` | session | self-report only |
| `GET /api/sites/{id}/export`, `…/export/measurements.csv`, `DELETE …/data` | session | delete: owner only |
| `DELETE /api/account` | session + password | |
| `POST /api/scam/inspect` | public | text analysis only, `{ "url": "…" }` |
| `POST /api/ingest/heartbeat` · `/measurements` · `/devices` | `Authorization: Bearer nsh_…` | sensor only; devices need site consent |

Errors: `{ "status": 400, "error": "Validation failed", "fields": { … } }`.

# API quick reference

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

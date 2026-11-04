# Threat model (initial, self-assessed)

Not independently reviewed. See "Residual risk".

| Threat | Mitigation in code | Test |
|---|---|---|
| Cross-household data access (IDOR) | `SiteAccess` on every site route; 404 for non-members; sensor site derived from token | `crossHouseholdAccessIsDenied`, `viewerRoleCannotWrite` |
| Credential stuffing | bcrypt-12, 5 failures/15 min per email+IP → 429 | `loginRateLimitedAfterRepeatedFailures` |
| CSRF | Cookie-to-header token on all non-GET session routes; SameSite=Lax | `stateChangingRequestWithoutCsrfIsRejected` |
| Session fixation | `changeSessionId()` on login | — (code review) |
| Stolen/leaked sensor token | Hash at rest, expiry, revoke, narrow scope (own site, ingest only) | `sensorLifecyclePairHeartbeatAndRevoke`, `expiredEnrollmentTokenIsRejected` |
| Browser session used on ingest | Filter clears context; ingest requires `ROLE_SENSOR` | `ingestRequiresValidSensorToken` |
| SSRF via Scam Shield | URL is parsed as text; no network I/O anywhere in `UrlInspector` | `UrlInspectorTest` (no I/O by construction) |
| Malicious telemetry (oversize, bad kinds, old/future timestamps) | Bean validation, caps (200 items), time window, latency bounds | `invalidMeasurementsAreRejectedOrDropped` |
| SQL injection | Parameterised queries only | review |
| CSV/formula injection | Leading `=+-@` neutralised | `exportCsvDeleteAndRetentionObeyOwnership` |
| Agent abused as scanner | Explicit targets only, max 10, min 10 s interval, ARP read filtered to approved CIDRs (≥/8), no listening sockets, plain HTTP only to localhost | `AgentTest` |
| Unconsented device collection | Server rejects `/ingest/devices` unless site consent is set; agent doesn't read ARP without consent | `deviceFlowRequiresConsent…`, `cycleSendsHeartbeat…` |
| Info leakage in errors | Uniform JSON errors, no stack traces | `malformedBodyReturnsCleanJsonError` |
| Secrets in repo/logs | `.env` ignored; no secrets committed; tokens not logged | CI gitleaks job (not yet run) |

## Residual risk / not done
No MFA; no email verification; in-memory rate limiter (single node, resets on restart); no account lockout notification; no encryption at rest beyond database config; TLS termination is the deployer's job; no dependency/SBOM pipeline beyond `npm audit` in CI; no DAST/pen-test; audit log has no UI and is not tamper-evident; CSP on the API is restrictive but the SPA CSP lives in nginx and allows inline styles/scripts (`unsafe-inline`) for the current bundle.

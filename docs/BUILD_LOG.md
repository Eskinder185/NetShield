# Build log

## 2026-11-04 (session 1)
- Repo audit, own git repo + branch `feat/netshield-foundation`; docs scaffolded.
- **API** (`services/api`): auth, sites, sensors, ingest, diagnosis, devices, findings, protection, scam, reports, account, retention. `mvn test` → 37 passed (19 integration, 9 engine, 9 URL). Fixed along the way: test-profile config clobbering main yml; unknown routes returning 500 (now 404/405); URL parser rejecting non-ASCII hosts (homoglyphs) and bad schemes; brand-lookalike detection.
- **Agent** (`services/agent`): `mvn test` → 9 passed. Fixed: old compiler plugin ignoring `release`; ARP regex for Linux `(ip)` format.
- **Real end-to-end smoke** (API on `h2` profile, loopback port 18080 only): register → consent → enroll → real agent ×6 (`--once`, loopback targets) → sensor ONLINE → diagnosis from stored data → CSV export. Result matched expectation (public IP:443 not listening locally ⇒ provider-side verdict). No external network contacted.
- **Web** (`apps/web`): `tsc`, `eslint`, `vite build` clean; `vitest` → 43 passed including axe checks on all public pages and the main demo pages. axe caught and we fixed: skipped heading levels, invalid `role` on `article`, an empty device heading caused by `??` on an empty-string hostname.
- Infra written: `docker-compose.yml` (loopback-only, `docker compose config` validates), Dockerfiles, nginx CSP, `.env.example`, CI workflow, dev scripts. **Not run:** containers, CI, Postgres migration.
- **Not done / honest gaps:** no screenshots or real-browser layout/contrast review (no browser automation configured here); PostgreSQL not exercised; MFA/email/billing absent by design; see `FEATURE_STATUS.md`.
- Incident: an interrupted turn rolled back ~22 written source files; they were recreated and committed immediately. Commit early.

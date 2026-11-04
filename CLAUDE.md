# NetShield: working notes for Claude Code

Home-network "internet doctor + security" product. Read `docs/FEATURE_STATUS.md`, `docs/IMPLEMENTATION_PLAN.md` (resume point), `docs/DECISIONS.md` first. Master spec: `NetShield_Claude_Code_Autonomous_Build_Prompt.md`.

## Layout
`services/api` Spring Boot 3.3 / Java 17 / JdbcTemplate / Flyway · `services/agent` JDK-only sensor · `apps/web` React+Vite+TS · `docs/` · `infra` via root `docker-compose.yml`.

## Commands (set `JAVA_HOME` to a JDK 17+ first; on this machine `C:\Program Files\Java\jdk-17`)
- API tests: `cd services/api && mvn -B test` (H2, `test` profile). Run locally without Docker: `mvn spring-boot:run -Dspring-boot.run.profiles=h2`.
- Agent: `cd services/agent && mvn -B test`; jar via `mvn package`.
- Web: `cd apps/web && npm ci && npm run lint && npm run typecheck && npm test && npm run build`; dev server `npm run dev` (proxies `/api` → 127.0.0.1:8080).
- Everything: `make test` (or run the three above).

## Rules that must not regress
1. Never show "protected/secure/fixed" without evidence. Unknown, offline or unconfigured ≠ safe. Retest only reports improvement from new sufficient measurements.
2. Demo data is synthetic, labelled, in-memory, and never mixed with live data (`Workspace` interface).
3. Every `/api/sites/{id}/**` handler must go through `SiteAccess`; add a cross-household assertion in `ApiIntegrationTest` for any new site route.
4. No server-side fetching of user-supplied URLs. The agent probes only explicitly configured targets and never scans.
5. No fake integrations, checkout, email, VPN, or MFA: disable and explain instead.
6. Plain-English copy first; technical detail behind "Show technical details". Colour is never the only signal (pair with icon + text).
7. Keep `docs/FEATURE_STATUS.md`, `BUILD_LOG.md`, `USER_ACTIONS_REQUIRED.md` truthful and current. Commit early (a rollback once lost uncommitted work).

## Definition of done
Tests added and passing for the layer touched; lint/typecheck/build clean; docs updated; no new claim without evidence; no push, deploy or spending.

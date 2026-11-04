# Implementation plan & resume point

| Phase | Status | Notes |
|---|---|---|
| 0 Recon & docs | Done | `REPO_AUDIT.md`, `CLAUDE.md`, this folder |
| 1 Website + app shell | Done (baseline) | public routes, demo workspace, live app, auth, onboarding, themes. Browser-based visual QA **not done** |
| 2 Backend + DB + auth | Done | PostgreSQL path unverified (USER_ACTIONS #1) |
| 3 Sensor + Internet Doctor | Done | agent, ingest, rules, retest, injected-scenario tests, real loopback E2E |
| 4 Home Guardian, Protection, Scam Shield | Done (MVP) | no router/DNS/Wazuh integrations (interfaces not yet written) |
| 5 UX maturity & extra features | In progress | design-system/UX pass requested in the follow-up directive: see below |
| 6 Quality & DX | Partly | tests, lint, build, CI file, compose written; Docker, CI, SBOM, DAST not run |
| 7 Handoff | Pending | final summary after phase 5/6 |

## Next (resume here)
1. **UX/design directive** (second user prompt, "Premium UI/UX"): audit rendered pages at mobile/tablet/desktop (needs Playwright + browsers or another screenshot tool), fix visual/usability problems, write `docs/DESIGN_SYSTEM.md`, improve illustrations/charts, polish mobile. Keep honesty rules.
2. Verify on PostgreSQL via Docker; run the CI workflow locally if possible.
3. Integration adapter interfaces (router, DNS filter, WireGuard, Wazuh/Suricata, AI) with explicit "unconfigured" implementations and tests.
4. Backlog candidates that are software-only: B03 browser bandwidth test, B07 resolver comparison, E05 enrichments (still without fetching), D06 allow/block lists (data model only), J07 weekly digest (needs email → gated).

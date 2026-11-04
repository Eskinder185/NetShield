# Implementation plan & resume point

| Phase | Status | Notes |
|---|---|---|
| 0 Recon & docs | Done | `REPO_AUDIT.md`, `CLAUDE.md`, this folder |
| 1 Website + app shell | Done (baseline) | public routes, demo workspace, live app, auth, onboarding, themes. Real-browser audit done (see BUILD_LOG) |
| 2 Backend + DB + auth | Done | PostgreSQL path unverified (USER_ACTIONS #1) |
| 3 Sensor + Internet Doctor | Done | agent, ingest, rules, retest, injected-scenario tests, real loopback E2E |
| 4 Home Guardian, Protection, Scam Shield | Done (MVP) | no real router/DNS/Wazuh integrations; `integration/` adapter interfaces are all "not configured" |
| 5 UX maturity & extra features | Mostly done | design system documented; real-browser audit clean; more illustrations/pages polish and human testing remain |
| 6 Quality & DX | Partly | tests, lint, build, CI file, compose written; Docker, CI, SBOM, DAST not run |
| 7 Handoff | Done for this session | final summary delivered; continue from "Next" |

## Next (resume here)
1. **Remaining UX work:** review the rest of the screenshots by eye, keyboard/screen-reader walkthrough, richer illustrations and charts using real history data, user testing.
2. Verify on PostgreSQL via Docker; run the CI workflow locally if possible.
3. Real (read-only) integration adapters, starting with one router model.
4. Backlog candidates that are software-only: B03 browser bandwidth test, B07 resolver comparison, E05 enrichments (still without fetching), D06 allow/block lists (data model only), J07 weekly digest (needs email → gated).

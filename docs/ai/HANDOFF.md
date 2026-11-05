# Phase 2 handoff

Resume from `docs/ai/PHASE2-IMPLEMENTATION-PLAN.md` and `docs/ai/FEATURE-STATUS.md`. Current branch is `feat/netshield-foundation`; inspect `git status` before editing because this milestone has uncommitted changes. No commit, push, deployment, or live network action was performed.

This milestone changed Internet Doctor verification and diagnosis wording/rules. Retest now returns `beforeEvidence`, `beforeWindowStart`, `beforeWindowEnd`, `verifiedAt`, and `after`. The UI displays loss and typical delay before and after. Coverage has a new read-only site endpoint and a selectable UI. Scam Rescue adds Flyway V2 (`scam_cases`, `scam_steps`), scoped case APIs, a checklist UI, export, deletion, and 30-day purge. The reliability endpoint produces conservative sampled periods and gap labels for the report page. Trusted Helper adds Flyway V3, an owner invitation view, one-time acceptance, a separate read-only helper API, notes, and revocation. Demo data remains synthetic and in browser memory.

Next highest priority: complete PostgreSQL/Docker QA and signed-in browser testing. Then add explicit agent capability declarations and verified integration sources to coverage. Expand Scam Rescue with reviewed jurisdiction-aware official resources. Improve long-range ISP aggregation and latency/loss evidence before making stronger reliability claims.

Run with `JAVA_HOME` set to JDK 17: `mvn -B test` in `services/api`; `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` in `apps/web`. Review `docs/USER_ACTIONS_REQUIRED.md` before any Docker or integration work. Separate approval is needed before touching the user's actual home network or cloud accounts.

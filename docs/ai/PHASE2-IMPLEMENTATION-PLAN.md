# Phase 2 implementation plan

Updated 2026-11-05. Branch: `feat/netshield-foundation`; working tree was clean before this milestone. Existing React/TypeScript, Spring Boot/JdbcTemplate, Flyway, H2/PostgreSQL, and Java sensor architecture is retained. The audit source is the existing README, docs, API, web app, agent, and tests. No home network, router, Proxmox host, or cloud account was accessed.

## Delivery order

1. **2A Stability — in progress.** Closed a false verification path in Internet Doctor: retests now require measurements newer than the saved baseline. Corrected a DNS diagnosis that lacked direct connectivity evidence. Added regression assertions and a measured before/after view.
2. **2B Design system — in progress.** Existing dark/light responsive system and accessibility checks remain. Review the complete mobile and desktop journeys with a browser and screen reader before claiming WCAG 2.2 AA.
3. **2C Internet Doctor — in progress.** Current sensor probes gateway TCP, DNS, public IP, and public HTTP. Add an evidence model for alternative causes and missing data, better symptom guidance, and reliability history. Retest needs fresh samples from each required kind; it never executes a router change.
4. **2D Coverage map — in progress.** Eleven read-only states now derive from sensor heartbeat, consent, and observation timestamps. The UI has selectable layers and observed devices. Add declared agent capabilities and verified integration checks before claiming any active protection.
5. **2E Scam Rescue — in progress.** Site-scoped structured cases, ordered checklist steps, export, deletion, and 30-day retention are implemented. Expand platform-specific guidance and authoritative reporting resources after review; no secrets or free-text notes are collected.
6. **2F ISP evidence — in progress.** A dated one-day, one-week, or one-month sampled timeline now distinguishes failed checks, normal checks, mixed data, and monitoring gaps. The web report provides a support message and browser PDF saving. Add robust long-range aggregation, note taking, and measured latency/loss trends before calling it complete.
7. **2G Trusted Helper — in progress.** Separate backend grants now enforce one-time acceptance, 24-hour invitation expiry, two-hour read-only sessions, owner revocation, scoped diagnostic summaries, suggestions, and audit events. Notes and invitations purge 30 days after access ends. The UI makes sharing, activity, and revocation visible. Add safe invitation delivery and broader failure testing before production use.
8. **2H Expansion — planned.** Prioritize offline guidance and monthly summaries using existing data. Router actions, VPN, DNS filtering, and endpoint claims wait for compatible verified integrations.
9. **2I QA — planned.** Run PostgreSQL and Docker path, real-browser accessibility and mobile review, dependency/security review, and failure scenarios.

Finish each vertical slice with API ownership checks, stored data lifecycle, failure states, UI, and tests. Do not label a feature production-ready from local tests alone.

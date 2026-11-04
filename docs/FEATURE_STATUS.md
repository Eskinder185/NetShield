# Feature status

Legend: **Working/Tested** (implemented, automated tests pass) · **Working** (implemented, manually exercised only) · **Demo** (synthetic data only) · **Gated** (needs setup you must do) · **Planned** · **Blocked**.
IDs refer to the 161-feature catalog in `NetShield_Claude_Code_Autonomous_Build_Prompt.md`.

Test evidence (last run 2026-11-04): API 38/38, agent 9/9, web 43/43 (incl. axe checks), `tsc`, `eslint`, `vite build` clean. See `BUILD_LOG.md`.

| Area | IDs | Status | Where | Evidence / notes |
|---|---|---|---|---|
| Demo mode with labelled synthetic data | A02 | Working/Tested (Demo) | `apps/web/src/demo/` | Unit tests assert source `DEMO_SYNTHETIC`; never calls the API for data. |
| Sensor pairing, scoped tokens, revoke | A05, M04, M05 | Working/Tested | `SensorService`, `SensorTokenFilter`, `IngestController` | Hashed token, 7-day pairing expiry, revoke/expiry/stale tests; real agent run verified end-to-end on loopback. |
| Local agent (outbound-only, explicit targets, caps, backoff) | A03, M05 | Working/Tested | `services/agent` | 9 tests incl. fake-API flow and revoked-token stop. Safe uninstall = delete the jar/stop the process. **Windows-specific helper (A04) not built.** |
| Internet status: gateway/DNS/public checks | B01, B02 | Working/Tested | `Probes`, `DiagnosisEngine` | Gateway uses TCP connect, not ICMP (no privileges). Scheduled by `--interval`. |
| Root-cause decision tree incl. insufficient-evidence | B05, I01 | Working/Tested | `DiagnosisEngine` | DNS failure, gateway, upstream, one-site, jitter, healthy, inconclusive all covered. |
| Troubleshooting wizard with retest & honest outcome | B06, J03, J04 | Working/Tested | `InternetDoctor.tsx`, `DiagnosisService.retest` | Retest never reports VERIFIED without new sufficient data. |
| Outage timeline, history | B08 (partial), J02 | Working | `/diagnosis/history`, Reports | Saved checks only; no automatic power-vs-ISP outage detection. |
| Manual browser bandwidth test | B03 | Planned | | |
| DNS resolver comparison | B07 | Planned | | |
| Loaded-latency / ISP baselines / gaming reports | B10–B12 | Planned | | |
| Wi-Fi signal/roaming diagnostics | B13–B14 | Planned | | needs OS/controller data |
| Device inventory (consented, passive ARP, CIDR-limited) | C01–C04, F01 | Working/Tested | `ArpReader`, `DeviceService` | Hash-only identity; MAC randomization flagged; vendor guess LOW confidence from a tiny illustrative OUI table. Does not discover everything. |
| Unknown-device finding lifecycle | C03, D01 | Working/Tested | `DeviceService`, `FindingController` | Create → review → mark known (auto-resolve) → reopen. |
| Protection checklist (self-reported vs verified) | D03, D04, C06 | Working/Tested | `ProtectionController` | Nothing can be "verified" yet; tests assert that. Router checks (C06 verification) **Gated** on a router integration. |
| Plain-English explanations + technical toggle | D02, I04 | Working | `AlertCard`, `TechDetails` | |
| Scam Shield URL inspector (offline, no fetch) | E01, E02 | Working/Tested | `UrlInspector`, `ScamShield.tsx` | benign, lookalike, punycode, `@` trick, IP host, shortener, malformed. Never says "safe". Reputation/age/redirects (E05) **not** done. QR via pasted decoded URL only. |
| "I clicked a bad link" flow, scam education | E03, E08 | Working | `ScamShield.tsx` | Static guidance. |
| Account-protection checklist | E07 | Partial | Protection checklist item for MFA | |
| Auth: bcrypt, rate limit, sessions, CSRF | M02 (partial) | Working/Tested | `AuthController`, `SecurityConfig` | **MFA not implemented. No email verification or password reset (no email service).** |
| Household/site scoping & cross-tenant isolation | M02, M03 | Working/Tested | `SiteAccess` | Test hits every site endpoint as another household → 404; viewer role → 403. |
| Schema + Flyway migrations | M03 | Working/Tested on H2 | `V1__core_schema.sql` | **Not yet run against real PostgreSQL** (Docker daemon off; local Postgres needs a password). See USER_ACTIONS. |
| Export (JSON/CSV), delete data, delete account, retention | A09, J09, M08 | Working/Tested | `ReportController`, `AccountController`, `RetentionJob` | CSV formula injection neutralised. |
| Audit log | M11 (partial) | Working | `Audit`, `/audit` | Written for key actions; no UI. |
| OpenAPI docs | M01 | Working | `/api/docs` | |
| Family: owner grouping | G02 (partial) | Working | `Family` page | Controls (G03–G05, G09) **Gated** on router/DNS integration — shown disabled. |
| Privacy dashboard | J08 | Working | `PrivacyVpn` | Table of what's collected. |
| VPN | H01–H08 | Education only | `PrivacyVpn` | No tunnel. Planned/Gated. |
| Reports: printable, JSON/CSV | J07 (partial), B11 (partial) | Working | `Reports` | PDF via browser print. No weekly digest/ISP-plan comparison. |
| Rules-based assistant | I03 (partial), I11 | Working/Tested | `Assistant` | Keyword rules over real check data. No LLM; adapter **Planned**. |
| Advanced Lab | L02, L05–L06 (partial) | Demo | `Lab` | Glossary real; simulations clearly marked SIMULATED; integrations all "Not configured". |
| Onboarding | A01 | Working | `Onboarding.tsx` | Skippable steps, sensor pairing, consent. |
| Dark/light, responsive, a11y | J05, J06 | Working/Tested | `styles/`, `qa/audit.mjs`, axe tests | Real-Chrome audit 126/126 clean (contrast, overflow, targets). Manual screen-reader/keyboard walkthrough not done. See `DESIGN_SYSTEM.md`. |
| Marketing site | — | Working/Tested | `pages/public` | Pricing is preview only, no checkout. Legal pages are drafts. |
| Docker Compose, CI | M07 | Written; compose config validated | `docker-compose.yml`, `.github/workflows/ci.yml` | **Containers never built/run here (Docker daemon off).** CI not run (no push). SBOM generation not yet configured. |
| Payments/billing, email, notifications | M12, J10 | Gated | | needs third-party accounts |
| DNS filtering, blocklists, allowlists | D05, D06 | Gated | | needs resolver/gateway integration |
| Integration adapter interfaces (all "not configured") | A07, D11, H01, I02 | Working/Tested (interfaces only) | `integration/`, `GET /api/integrations` | No real adapter exists. |
| Wazuh/Suricata, CVE feeds, honeypots | D11–D13, L09 | Planned | | |
| Router adapters, isolation, VLAN wizards | A07, C12, F06 | Planned/Gated | | |
| Browser extension | E04 | Planned | | |
| Multi-site, roles, MSP, ticketing | K01–K11 | Planned | | only owner/member/viewer roles exist |
| Mobile (macOS/Android/iOS) | A10 | Planned | | |
| Multi-language, benchmarks | J13, J14 | Planned | | |
| Signed agent binaries / updates | M14 | Planned | | |

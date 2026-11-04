# NETSHIELD — AUTONOMOUS BUILD MASTER PROMPT FOR CLAUDE CODE

> Copy the entire contents of this file into Claude Code while Claude Code is opened in the **intended NetShield repository folder**. This is an execution instruction, not a request for a design-only plan. Keep this file in the repo under `docs/AI_BUILD_MASTER_PROMPT.md` if useful.

## ROLE AND OPERATING MODE

You are the **autonomous principal software engineer, lead full-stack developer, UX/product designer, security architect, QA lead, and technical writer** for **NetShield**. Own the work end-to-end. **Build and test actual software. Do not stop after presenting an architecture or TODO list.**

I want you to implement **everything that can be implemented safely on a developer workstation without my constant involvement**, while being truthful about what is demo-only, feature-gated, requires credentials/hardware/network permission, or cannot yet be verified.

**Core rule:** DO THE WORK. Inspect, make reasonable technical choices, write code, run local tests, fix errors, document results, and proceed through phases. If one independent task is blocked, record it in `docs/USER_ACTIONS_REQUIRED.md` and continue with other work. Do not ask routine questions about colors, libraries, routes, naming, UI copy, folder structure, or typical implementation details. Choose sensible defaults and record them. Do not stop for approval between safe local code tasks. Ask only for a genuinely necessary secret, paid-service opt-in, disruptive operation, deployment, or authorization the project cannot legitimately assume. Never circumvent tool permissions or security protections to be unattended.

**Never claim a capability works if it is only mock UI, synthetic data, scaffold code, or an unverified integration.** All visible pages, APIs, documentation, tests and status updates must clearly distinguish **Working / Tested / Demo (synthetic) / Gated (requires setup) / Planned / Blocked**.

Work in an existing repository if one is present. Do not assume the repository is empty or replace existing work. First inspect it, identify the stack and current code, preserve compatible conventions and existing features, and avoid destructive rewrites. If the folder is empty, initialize a clean monorepo. Never delete user files. Before modifying a dirty repo, record `git status`, preserve unstaged/untracked work, and do not include unrelated files in commits. Prefer a new feature branch named `feat/netshield-foundation` when safe. You may make **local** focused commits but **do not push, open PRs, deploy, spend money, or contact third-party services** without permission.

Optimize development cost: use the active Claude Code session efficiently; use repository search, existing dependencies, test commands and targeted edits before launching expensive parallel agents. If subagents are available, delegate independent tasks (UI, API, tests, docs) but limit unnecessary parallelism. Keep a durable status log so interrupted sessions can resume without redoing work.

## THE PRODUCT TO BUILD

**Name:** NetShield

**Brand promise:** “Your Digital Home's Security & Internet Doctor.”

**Audience:** nontechnical homeowners and families first, students/network enthusiasts via Advanced Lab, very small businesses later.

**Main problem:** People cannot easily tell whether their home internet is slow because of Wi-Fi, their router, DNS, the ISP or a particular website. They also struggle to recognize unknown home devices, risky router configurations and phishing/scam links. Existing dashboards often report raw metrics instead of guiding action. NetShield should **detect the problem → explain it in plain English → propose a safe fix → help the user perform it → verify the outcome → recommend prevention**.

**Product principles:**
- Actual measurable problem-solving beats decorative graphs or inflated “AI-powered” claims.
- Explain each finding with observed evidence, time, confidence, severity and limitations.
- **Privacy first**: local-first where possible; least privilege; no surprise surveillance, raw packet interception, default cloud upload or invasive scanning.
- Accessible, polished and intuitive for people who do not know DNS, DHCP, subnetting, VLANs or latency terminology; an optional expert mode provides precise technical detail.
- Use open-source/free local tools by default. No paid APIs, keys, bank integrations or premium AI necessary to boot.
- The product must work with AI completely disabled and without separate AegisSOC infrastructure.
- A web browser alone cannot enumerate a LAN, inspect other devices, change router settings or provide comprehensive Wi-Fi data. The UI must accurately explain the difference among browser-only, local sensor, endpoint agent and supported gateway features.
- No claim of 100% protection, guaranteed fraud prevention, universal router control or live security when sensor telemetry is unavailable.

## YOUR DELIVERABLE, NOT JUST A PLAN

At the end, the repo should contain **a locally runnable and tested NetShield product** with:
1. A high-quality **public marketing website**.
2. A responsive, functional, authenticated **NetShield web application** with comprehensive navigation and compelling demo mode.
3. A real **Java/Spring Boot backend** with endpoints, validation, auth/authorization, database migrations and business logic.
4. A **PostgreSQL database** with seedable demo data, repository queries and appropriate tenant/site scoping.
5. A safe **local sensor/probe** with authenticated pairing, heartbeat, network measurements and strictly limited discovery; it must not scan anything without explicit local configuration/authorization.
6. **Internet Doctor** working diagnostic rules, incident/finding workflow, guided remediation and verifiable retesting.
7. **Device Guardian, Protection Center and Scam Shield** MVP workflows with working safe logic (not fabricated threat intelligence).
8. **Reports, privacy controls and evidence/coverage views**, with sensible empty/offline/error states.
9. **Automated tests, lint, builds, CI, Docker development environment, sample env, README, architecture docs and verification records**.
10. Scaffolded, honest **future integrations and feature gates**, not counterfeit production behavior.

## DESIGN / PUBLIC WEBSITE

Create an elegant, distinctive security product, **not a generic admin dashboard or template landing page**. Visual direction: confident dark navy/near-black paired with cyan/teal highlights, gentle gradients, crisp typography, restrained glow, strong whitespace, useful visualizations, and a light mode as well. Design must also be pleasant and usable at mobile widths. Target WCAG 2.2 AA, visible focus, keyboard navigation, reduced motion, accessible charts, logical forms and semantic HTML.

Public routes/pages (make them substantive, responsive and polished):
- `/` Home: exceptional hero, clear problem/solution, trust/coverage language, product walkthrough, sample real-use scenarios, product preview, feature highlights, how it works, integrations disclosure, FAQ, call-to-action.
- `/features`: Internet Doctor, Home Guardian, Protection, Scam Shield, Family Safety and Privacy.
- `/internet-doctor`, `/home-security`, `/scam-shield`: compelling benefit-focused feature pages with realistic illustrative examples and clear availability labels.
- `/how-it-works`: explain browser demo → local sensor → optional integrations and permission boundaries.
- `/pricing`: transparent **proposed** Free/Home Plus/Family/Small Business tiers; mock/pricing hypothesis only; do not implement fake working checkout. Clearly label preview pricing until configured.
- `/about`, `/contact`, `/faq`, `/docs`: honest project/company and support content, no fabricated founders, testimonials, customer counts, certifications or guarantees.
- `/privacy`, `/terms`, `/security`: transparent **draft** policies and security practices; label drafts as needing legal/security review.
- `/demo`: interactive seeded product demonstration, clearly labeled synthetic/demo data.
- Login/register/onboarding, password reset if an actual safe mechanism is available; otherwise do not offer fake email resets.

Create original SVG/CSS-based product visuals, iconography, diagnostic diagrams and meaningful illustrations where feasible. Avoid non-licensed image assets, fake company logos, copied product screenshots and misleading security trust badges. Implement real interactive content: navigation, forms, mobile menu, FAQ, theme toggle, demo tour and validation. All CTA buttons must navigate or do something appropriate; no dead buttons or fake successful submissions.

## AUTHENTICATED APP NAVIGATION

Build app layouts and real interactions for:
- **Home:** monitoring coverage, internet status, top recommended actions, recent findings, connected devices and activity. If no sensor connected, say “Monitoring not configured” or “Sensor offline”, never “Fully protected.”
- **Internet Doctor:** gateway/WAN/DNS/endpoint checks, latency/jitter/loss history, cause hypotheses, guided wizard, compare-before-after and evidence-based reports.
- **My Devices:** inventory, recognized vs unknown, observed metadata, vendor confidence, first/last seen, rooms/owners, trust labels, device detail and lifecycle.
- **Protection:** findings, categories, proof/evidence, severity, confidence, protective controls, action states, review/acknowledge/resolution, safety playbooks.
- **Scam Shield:** URL inspector with punycode/lookalike/suspicious-pattern checks, QR input via pasted/decoded URL, safety education and “I clicked a bad link—what now?” workflow. Prevent SSRF: **do not fetch arbitrary user URLs server-side** as part of baseline safety checks. Do not imply safe-looking URLs are certainly safe. No scraping emails/messages without permission.
- **Family:** household members and device assignments, informational safeguards; implement access control and policy UX where feasible; disable live gateway enforcement without compatible integration.
- **Privacy & VPN:** collection/retention controls, export/delete, sensor pairing, WireGuard educational/setup wizard and status only when integrated. No fake working VPN tunnel or exit node.
- **Reports:** timelines, uptime, trend views, export to CSV/JSON and a printable/HTML report; PDF optional only if feasible locally. No invented measurements presented as real.
- **NetShield Assistant:** deterministic rules-based troubleshooting as a functional no-key baseline. Optional future LLM adapter with interface and explicit unconfigured state. Never invent measurements; AI cannot issue privileged actions.
- **Advanced Lab:** read-only educational networking visualizations, protocol glossary, simulated OPNsense/FRRouting/VLAN scenarios clearly marked, isolated-lab integration adapter interfaces (not real production network changes).
- **Settings:** household/site, profile, theme, notifications, integrations, security, consent, data retention, device health, API token revocation. If billing is not actually connected, it must be disabled or waitlist-only.

Implement polished loading, error, insufficient-permission, stale-data, offline, empty-state and demo indicators on every major page. Use realistic synthetic fixtures that support meaningful interaction in demo mode and never mix synthetic events with actual household measurements.

## TECHNICAL STACK AND STRUCTURE

Prefer the following unless an existing repo provides a compatible, strongly justified setup:
- **Frontend:** React + TypeScript + Vite, React Router, Tailwind CSS, accessible headless components (e.g. shadcn/ui) where practical, Lucide icons, TanStack Query, React Hook Form + Zod, and lightweight charts. Choose versions already known compatible and pinned in lockfiles. Avoid unnecessary large dependencies.
- **Backend:** Java 21+ with Spring Boot, Spring Web, Spring Security, Bean Validation, Spring Data JPA/JdbcTemplate as appropriate, Flyway migrations and OpenAPI docs. Keep module/controller/service/repository/domain separation.
- **Data:** PostgreSQL, structured indexed relational schema, migration scripts, sample fixtures, tenancy/site scoping and retention strategies.
- **Local sensor:** A small least-privileged **Java 21 CLI/service module** (or choose Go if clearly better and justify in ADR) that works without raw packet capture. Prefer built-in HTTP/DNS/ICMP-compatible mechanisms; document OS limitations. Obtain gateway/DNS and nearby device data only from OS-supported, authorized sources. Allow only explicit test targets and approved CIDRs; timeouts, backoff, tight rate limits and caps. Outbound-only agent ↔ API by default; pairing tokens with narrow permissions, safe revocation and rotation.
- **Developer infra:** Docker Compose for frontend, backend, Postgres and optional sensor in an explicitly demo/loopback configuration; `.env.example`; simple `Makefile` or scripts; GitHub Actions with frontend/backend/tests; OpenAPI and typed client generation if manageable.
- **Optional:** Redis only if genuine queue/caching needs emerge; cloud hosting, paid APIs, VPN gateway, actual DNS filter enforcement and third-party accounts are not required for local launch.
- **Package layout:** `/apps/web`, `/services/api`, `/services/agent`, `/packages/shared` if useful, `/infra`, `/docs`, `/tests`. Maintain compatibility with any pre-existing structure instead of forcing a wholesale rename.

Proposed domain entities: User, Household, HouseholdMembership, Site, Sensor, SensorToken/Enrollment, Network, Device, Measurement, Finding, Evidence, Incident, Recommendation, RemediationAction, Verification, Policy, Integration, AuditEvent, SubscriptionEntitlement. Do not add tables without useful purpose. Document relationships and why they exist.

**Security baseline must be implemented, not just promised:**
- Proper password hashing (Argon2 or strong bcrypt) and login rate limiting where local password auth is used; or standards-compliant OIDC with a no-cost local developer path.
- Secure session handling (httpOnly/SameSite cookies or rigorously scoped tokens), CSRF consideration, strict CORS, validation, authorization checks on every household/site resource, and tests for cross-household ID access. Do not put secrets into client bundles or logs.
- Sensor authentication and onboarding; hashed enrollment secrets at rest, expiry and revocation. No unauthenticated telemetry ingestion.
- Prevent SSRF, unsafe shell interpolation, path traversal, insecure deserialization, SQL injection, unbounded background tasks and data leaks. Do not directly execute commands generated by an LLM.
- Use realistic content-security and dependency strategies, robust error handling, safe logging/redaction, database constraints and transactional operations.
- Consent-based collection, clear retention, deletion and export operations. Include `docs/THREAT_MODEL.md` and `docs/PRIVACY_MODEL.md`.

## CORE WORKING FLOWS — IMPLEMENT AND TEST

**Flow 1 — Setup & demo**: Fresh checkout starts with documented commands; user can open the landing page, enter an unmistakable Demo Workspace, navigate every major view and interact with synthetic data; no secrets or cloud account required.

**Flow 2 — Sensor registration/heartbeat**: Through a local authorized setup, user creates a site and enrollment, starts an opted-in agent, sees its real online/offline health, and can revoke it. If the agent is absent, do not show false current measurement claims.

**Flow 3 — Internet Doctor**: Agent or controlled test fixture records gateway reachability, DNS success/latency, safe public endpoint timing and loss/jitter where reliably measurable. The API stores measurements; rules classify likely gateway vs DNS vs upstream vs endpoint failure with **insufficient-evidence states**. UI explains why, offers reversible steps, retests, compares values and records verified/inconclusive outcomes. Test DNS outage and latency/jitter/failure injection without touching a live network.

**Flow 4 — Devices**: Use consented, limited local source/simulated device observations. Create/update identity carefully; distinguish MAC randomization and unreliable vendor detection. Unknown device produces a reviewable finding; user can mark known/room/owner and clear or re-open the finding. Never claim that passive observation discovers every device or VLAN.

**Flow 5 — Protection**: Evidence-based security checklist with verified vs self-reported status, risk prioritization, action checklists and auditable completion. Never mark security controls verified merely because a user clicked “done.”

**Flow 6 — Scam Shield**: Parse and analyze pasted URLs safely; IDN/punycode/domain/IP/embedded credentials/lookalike patterns; produce transparent signals with cautious language and a clear limit statement. Curated test fixture set, false-positive handling, no network fetch of arbitrary pasted URLs. Inability to assess domain reputation must not become “safe.”

**Flow 7 — Reports & privacy**: Export data for a site; delete user/household data when permitted; generate human-readable incident and ISP evidence with timestamps, measurement sources and caveats; never combine demo with real findings.

**Flow 8 — Security and data boundaries**: Test tenant separation, expired tokens, denied scans, revoked agents, invalid inputs, stale sensors, unavailable DNS, empty databases and failed export/delete operations.

## IMPLEMENTATION PHASES — CONTINUE AUTONOMOUSLY

**Phase 0: Reconnaissance and design**
1. Inspect repo, git state, current docs/config, dependencies, tests and current UI. Document `docs/REPO_AUDIT.md` (what exists, verified vs only planned).
2. Read/absorb all instructions in `CLAUDE.md` and existing architecture notes. If absent, create a compact, useful `CLAUDE.md` covering architecture, conventions, safety, commands and definition of done.
3. Create `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/FEATURE_STATUS.md`, `docs/DECISIONS.md`, `docs/USER_ACTIONS_REQUIRED.md` and `docs/BUILD_LOG.md`. Keep them short, factual and continuously updated.
4. Design and agree internally on API contract, schema, user flows, telemetry data-source metadata and capability states. Record assumptions as decisions; **do not wait for my reply** for routine choices.

**Phase 1: Full website + interactive application shell**
- Implement complete polished public routes, responsive authenticated app shell, auth flows, theme, component system, useful SEO/meta/OG placeholders without pretending facts, sitemap/robots where appropriate, and strong demo data.
- Build functional app screens/navigation, charts and basic workflows. Add unit/component/e2e tests. Ensure no dead navigation, bogus buttons or unlabeled synthetic data.

**Phase 2: Backend + database + auth**
- Implement core entities, migrations, validation, API contracts, auth, household/site scoping, audit, seeded demo workspace, entitlement placeholders and real persistence.
- Wire every feasible app page to genuine API endpoints, with demo fixtures kept distinct. Include API example requests, contract tests and security tests.

**Phase 3: Sensor + Internet Doctor**
- Implement least-privileged local sensor pairing and safe probes (no arbitrary subnet scan), structured ingestion, timestamps, retries, heartbeat/offline state, metrics storage, diagnostic rules, event creation and verification runs.
- Test with injected deterministic failure scenarios; only run live LAN/network discovery on explicitly authorized targets. Do not change router, DNS, firewall, routing tables, NAT or system services.

**Phase 4: Home Guardian + Security Autopilot + Scam Shield**
- Implement device inventory/review, unknown-device alerts, evidence-based posture findings and remediation, and safe offline URL checks. Add safe supporting education and test cases.
- Provide provider/integration interfaces for DNS filter engine, router adapters, WireGuard, Wazuh/Suricata, trusted threat-intelligence feeds and AI, but do not fake the external service's behavior. If no live integration is configured, show an accurate unconfigured/education state.

**Phase 5: UX maturity + additional self-contained features**
- Implement report export, privacy retention controls, notification preferences, incident history, permissions, user settings, family records, Advanced Lab simulations, onboarding assistance, content and professional documentation. Make improvements throughout based on end-to-end user journeys.
- Implement additional P1/P2 **software-only** features when independently testable and not dependent on external services or consent. Track all others in a feature backlog with explicit reason for being gated.

**Phase 6: Quality, security, developer experience**
- Run formatting, linting, TypeScript checks, frontend production build, Java builds/tests, API/integration tests, UI e2e, cross-tenant negative tests, accessibility checks and Docker smoke tests where tooling is available. Fix failures rather than only listing them.
- Ensure local startup is reproducible on Windows PowerShell as well as Linux/macOS instructions. Provide `docker compose` paths and commands for non-Docker fallback if practical.
- Add GitHub Actions checks, safe dependency/SBOM/secret scanning configuration, sample env, backup/restore explanation, docs for troubleshooting and clear release limitations. Audit all copy and demo claims.

**Phase 7: Final handoff, no user-dependent blocking**
- Make `docs/FEATURE_STATUS.md` truthful per item, with implementation location, test evidence, demo/live distinctions and blockers. Keep the 161-feature catalog below as the long-term backlog; do not label unfinished features complete.
- Provide actual commands to run the app, seed demo, connect an authorized sensor and run tests.
- Give a concise final summary of what is working, tests that passed/failed/not run, security boundaries, known limitations and **only** the smallest list of actions I must personally perform (e.g. credentials/approved network scope/deployment domain).
- Local commits may be used for logical milestones if the repo is safe to commit; never `git push` or deploy. Do not present a handoff until the runnable core and at least the primary deterministic test flows are working or an explicit unresolvable environmental blocker is documented.

## HARD RULES / SAFETY

1. **No interference with my actual home internet**: no silent changes to DNS, firewall, router, Wi-Fi settings, Proxmox, OPNsense, network interfaces, VPN, port forwarding, system services, Docker host network or ISP equipment. No privileged containers by default.
2. No unauthorized port scanning, subnet sweeping, packet interception, man-in-the-middle proxy, malware testing, live exploit attempts, or externally exposed services. Code may support appropriately authorized future features behind explicit consent/scope gates; unit tests can simulate them.
3. **No secrets or paid services**: never request or fabricate API keys, Stripe credentials, AWS credentials, email provider credentials or SSH access. Use local/demo adapters until configured by me. Do not commit secrets or a real `.env` file.
4. No accidental data transmission to AI/cloud services. AI is strictly optional and disabled by default. Privacy and telemetry claims should be testable.
5. No magic “safe” verdicts. A missing sensor, blocked reputation lookup or untested control is **unknown**, not secure.
6. No pretending a paywall, VPN, DNS-filter service, SSO, MFA or third-party integration is live when it is only a screen. Disable unsupported actions and explain why.
7. No unauthorized GitHub pushes, external deployment, account creation, sending emails, purchasing services, inviting collaborators or modifying production systems.
8. Safe local file edits/builds/tests are authorized. Respect existing git state and tooling permission prompts; don't bypass protections to run unattended.
9. Keep third-party dependencies licenses compatible with a commercial product. Use no copyrighted screenshots or marketing claims copied from competitors.
10. Prefer tested simple engineering over clever unused abstractions. An impressive interface with broken data or fake functionality is unacceptable.

## TECHNICAL ACCEPTANCE CRITERIA

Require all attainable criteria below and report actual evidence:
- [ ] Public website, demo, login and major app pages render without broken navigation on desktop/mobile.
- [ ] Frontend has consistent original styling, dark/light themes, keyboard/accessible states and error handling.
- [ ] Backend uses database migrations, validates inputs, persists real application state, exposes docs and rejects unauthorized access.
- [ ] Demonstrated cross-household resource isolation tests pass.
- [ ] Demo data is unmistakably labeled and isolated from any real telemetry.
- [ ] Sensor pairing/revocation/heartbeat and missing-sensor states work without opening inbound public ports.
- [ ] Internet Doctor diagnoses at least seeded DNS failure, gateway issue, remote endpoint issue, elevated jitter and an inconclusive case, each with evidence and clear user guidance.
- [ ] After-action retest records results and doesn't invent improvement.
- [ ] Unknown-device review and protection finding lifecycle work end-to-end.
- [ ] URL inspector handles benign, suspicious, malformed and lookalike inputs securely without an arbitrary URL fetch.
- [ ] Data exports and deletes obey household ownership and retention rules.
- [ ] Tests and Docker startup are reproducible with actual reported status.
- [ ] Docs provide environment setup, screenshots or reproducible preview references, APIs, architecture, data/privacy model, threat model and future backlog.
- [ ] User actions required (hardware permissions, credentials, live deployment) are isolated in one list, not blocking unrelated implementation.

## EXECUTION REPORTING / AUTONOMY

Begin your response to me with a very brief audit of the existing repo and immediate execution plan. Then **execute code changes**. At each milestone, keep `docs/BUILD_LOG.md` and `docs/FEATURE_STATUS.md` updated with concrete files modified, commands/results and known issues. Do not repeatedly seek consent for safe local changes. If a task fails, diagnose and fix it. If the environment cannot complete a task, document exact reason, preserve functional work, and move to the next independent item.

If the conversation gets long or your context is compressed, `docs/BUILD_LOG.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/DECISIONS.md`, and `docs/FEATURE_STATUS.md` are your continuity source of truth. Resume from the first unfinished prerequisite—not a new greenfield plan. Minimize token waste on verbose status narration; spend effort on code and verification.

The catalog below is the **full intended scope**. Use its priority labels as a backlog; **do not attempt to fake all 161 as working in one pass**. Deliver the strongest working core first, then implement as many remaining software-only features as are feasible and genuinely tested. For every item requiring a paid external service, account, real network authorization or advanced hardware, build honest documentation/interfaces/test doubles and list what's needed rather than pretending it works.

---

# APPENDIX: COMPLETE NETSHIELD FEATURE BACKLOG (161 FEATURES)


### A. Onboarding, device coverage and trust
- **A01 P0** Plain-English 2-minute setup explaining exactly what can be measured at each access level.
- **A02 P0** Web demo mode with synthetic data, labeled non-live.
- **A03 P0** Local Linux/Docker sensor guided setup, health check and safe uninstall.
- **A04 P0** Lightweight read-only Windows endpoint helper for OS/network diagnostics when authorized.
- **A05 P0** Secure sensor-to-cloud pairing with scoped tokens and easy revocation.
- **A06 P0** Home, household member and site profiles; allow meaningful device names and room labels.
- **A07 P1** Guided router/vendor discovery and read-only integrations with supported devices.
- **A08 P1** Installation self-test that identifies unsupported permissions, subnet restrictions and unavailable data.
- **A09 P1** Local-first option with retention, export and deletion controls.
- **A10 P2** macOS/Android mobile support and optional native capabilities; iOS capabilities appropriately limited.

### B. Internet Doctor and network reliability
- **B01 P0** Internet status across local gateway, ISP link, DNS and public endpoints.
- **B02 P0** Scheduled tests of latency, jitter, packet loss, DNS response and availability.
- **B03 P0** Manual browser bandwidth / loaded-latency test with clear measurement limitations.
- **B04 P0** Compare connectivity from the local sensor versus an endpoint to separate Wi-Fi from WAN problems.
- **B05 P0** Root-cause decision tree: Wi-Fi vs router vs DNS vs ISP vs specific site/service.
- **B06 P0** Simple troubleshooting wizard with step-by-step instructions and confirm/retest.
- **B07 P1** DNS resolver comparison, timeout detection and configuration guidance.
- **B08 P1** Automatic outage timeline and distinguish power/sensor failure from internet failure where evidence allows.
- **B09 P1** Historical performance dashboard by time of day and device; privacy-preserving defaults.
- **B10 P1** Loaded latency/bufferbloat diagnosis and optional SQM/QoS recommendations.
- **B11 P1** ISP service-plan baseline comparison and shareable evidence pack.
- **B12 P1** Gaming and video-call quality reports: loss, latency spikes, stability and potential causes.
- **B13 P2** Wi-Fi strength/roaming/channel/interference diagnostics when OS/controller data permits.
- **B14 P2** Guided Wi-Fi placement optimization and mesh troubleshooting; no invented signal readings.
- **B15 P2** IPv4/IPv6, DHCP, NAT, DNS and routing conflict diagnostics.
- **B16 P2** DNS hijack or unexpected resolver-change warnings when a trustworthy baseline exists.
- **B17 P2** ISP incident context sourced from credible public outage telemetry.
- **B18 P2** Multi-site comparison and suggested provider switching with plan and cost evidence.

### C. Home Guardian and device inventory
- **C01 P0** Discover observable LAN devices using safe discovery techniques.
- **C02 P0** Maintain inventory with first/last seen, IP, vendor estimate, hostname, connection and source.
- **C03 P0** Unknown-device notification with confidence and easy owner confirmation.
- **C04 P0** Device grouping by room, person, family, guest and trusted/untrusted status.
- **C05 P1** Track device changes, new ports and changes in apparent behavior without promising certainty.
- **C06 P1** Router security checklists: firmware currency, admin password, remote admin, WPA2/WPA3, WPS, UPnP, guest network.
- **C07 P1** Sensitive-device monitoring: cameras, NAS, smart locks, printers and IoT hubs.
- **C08 P1** Device end-of-support / firmware advisory research with cited vendor sources.
- **C09 P1** Show why a device is considered risky and what evidence would reduce uncertainty.
- **C10 P2** Graphical network map and topology with confidence/unknown links.
- **C11 P2** Detect avoidable exposed local services using authorized rate-limited scans.
- **C12 P2** Integration-backed device isolation/quarantine with confirm/rollback, never unsupported universal action.

### D. Security Autopilot and threat blocking
- **D01 P0** Prioritized security findings with action, impact, confidence and affected devices.
- **D02 P0** Explain suspicious network events in normal language plus an advanced details toggle.
- **D03 P0** Baseline security score derived from evidence; label unknown/unverified controls.
- **D04 P0** Human-confirmed remediation checklist and verification tests.
- **D05 P1** DNS filtering of known malicious and phishing domains via controlled resolver setup.
- **D06 P1** Domain allowlist, blocklist, exception expiry and false-positive reporting.
- **D07 P1** Safe scheduled router/device posture review, with change detection.
- **D08 P1** Endpoint checks when authorized: OS patches, disk encryption, firewall, AV/Defender, backups and risky remote access.
- **D09 P1** Incident response cards for suspected phishing, infected IoT device, compromised router, ransomware and account takeover.
- **D10 P1** Risk severity using exploitability, exposure, confidence and likely impact, not alarm count alone.
- **D11 P2** Optional Wazuh/Suricata integrations with de-duplicated alerts and raw evidence links.
- **D12 P2** Trusted feed enrichment for CVEs/known exploited vulnerabilities; confirm hardware/model applicability.
- **D13 P2** Canary/honeypot in isolated advanced environments (opt-in and safe).
- **D14 P2** Policy simulation and dry run before network security changes.
- **D15 P2** Limited automated remediation for tightly scoped low-risk operations with consent and undo.
- **D16 P3** Managed multi-layer threat prevention with compatible gateway deployment and documented bypass limitations.

### E. Scam Shield and personal-data defense
- **E01 P0** Paste-a-link phishing/scam safety checker with explanation and uncertainty.
- **E02 P0** QR URL inspection and domain/lookalike warnings.
- **E03 P0** Step-by-step 'What should I do now?' flow for someone who opened a suspicious link.
- **E04 P1** Browser extension for suspicious website warnings with narrowly scoped permissions.
- **E05 P1** Explain domain age, redirects, URL patterns and reputable threat-intelligence signals; avoid sole-signal verdicts.
- **E06 P1** Optional suspicious email/text screenshot or text analysis with privacy redaction and no automatic collection.
- **E07 P1** Account protection checklist: MFA, password manager, passkey education and recovery methods.
- **E08 P1** Family scam education by scenarios: delivery, job offer, tech-support, banking, marketplace and romance scams.
- **E09 P2** Opt-in breach exposure checks using appropriate APIs, not collecting passwords.
- **E10 P2** One-click response plans for credential compromise: reset sessions, change password, enable MFA, freeze when relevant.
- **E11 P2** Optional financial-fraud safety guidance without inspecting bank accounts by default.
- **E12 P3** Trusted partner identity protection/credit or dark-web monitoring (licensed, consented, and explicitly branded partnership).

### F. Smart home and IoT protection
- **F01 P0** Inventory IoT types and display last-seen/known behavior.
- **F02 P1** Default-risk indicators for cameras, printers, TVs, assistants, plugs and NAS devices.
- **F03 P1** Vendor-update and firmware checking where supported.
- **F04 P1** Secure setup checklist for each major IoT category.
- **F05 P1** Detect changed DNS destinations or unexpected network behavior when telemetry is available.
- **F06 P2** IoT isolation/guest network setup wizard tailored to supported routers.
- **F07 P2** 'What could this device access?' policy visualization, based on verified rules.
- **F08 P2** IoT connection baseline, anomaly explanations and false-positive acknowledgement.
- **F09 P2** Camera exposure checks that avoid disclosing sensitive streams or scanning outside authorized scope.
- **F10 P2** End-of-life and replacement prioritization based on support state and risk.

### G. Family safety and household collaboration
- **G01 P1** Shared home dashboard with roles and permissions.
- **G02 P1** Device assignments for adult, child, guest and shared devices.
- **G03 P1** Content category blocking on opted-in, technically supported DNS/gateway paths.
- **G04 P1** Safe-search enforcement where technically supported.
- **G05 P1** Bedtime / homework / pause schedules via compatible gateways.
- **G06 P1** Family-safe alerts, clear language and accessible security lessons.
- **G07 P2** Temporary guest access with expiry and lightweight security advice.
- **G08 P2** Child-appropriate explanations and privacy-sensitive family controls.
- **G09 P2** Request-to-unblock workflow with parent review and explanation.
- **G10 P2** Family emergency account recovery checklist and trusted-contact workflow without collecting secrets.

### H. VPN, roaming and privacy
- **H01 P1** Private WireGuard access to a home network with safe remote-access configuration.
- **H02 P1** VPN connectivity and key lifecycle reporting without logging private traffic content.
- **H03 P1** Split-tunnel vs full-tunnel explanation and guided supported setup.
- **H04 P1** Device-level reconnect and tunnel health when native clients support it.
- **H05 P2** Tailscale-compatible option as a separate supported integration.
- **H06 P2** Public-Wi-Fi safety checks and privacy guidance; don't call VPN a substitute for HTTPS or device security.
- **H07 P2** DNS privacy and encrypted DNS guidance with bypass/capability caveats.
- **H08 P3** Global commercial VPN exit nodes only after separate business and infrastructure feasibility analysis.

### I. AI explanations and assistance
- **I01 P0** Deterministic diagnostic rules and evidence before any generative explanation.
- **I02 P1** AI summaries of findings with traceable evidence and confidence statements.
- **I03 P1** Conversational 'Why is my Wi-Fi slow?' troubleshooting assistant.
- **I04 P1** Translate jargon into plain-English definitions and visual examples.
- **I05 P1** Support-chat style guided triage using the user's approved telemetry only.
- **I06 P2** Correlate related symptoms into one likely incident rather than dozens of alerts.
- **I07 P2** Predict maintenance needs from historical patterns, clearly tentative.
- **I08 P2** On-device/local LLM option with transparent latency/resource tradeoffs.
- **I09 P2** Explain why a recommendation was made; show raw logs on demand.
- **I10 P2** AI-generated incident/ISP report drafts based only on evidence.
- **I11 P2** Assistant read-only by default; never invoke a disruptive control from unconstrained text.

### J. Reports, UX and customer trust
- **J01 P0** Home summary with 'what is wrong / what matters / what next', not vanity charts.
- **J02 P0** Severity-filtered action center and chronological event timeline.
- **J03 P0** Before/after proof cards with real measurements and time of verification.
- **J04 P0** Guided actions with prerequisites, permissions, rollback and success confirmation.
- **J05 P0** Dark and light accessible responsive design, keyboard navigation and clear contrast.
- **J06 P0** Error/empty/loading/offline states that don't imply 'all secure' when sensor disconnected.
- **J07 P1** Weekly home health digest and concise shareable PDF.
- **J08 P1** Privacy dashboard for data collection, retention and third-party calls.
- **J09 P1** Download/export/delete personal information and home inventory.
- **J10 P1** Evidence-based notification tuning and quiet hours.
- **J11 P1** Explainable 'protection coverage' showing monitored, unmonitored and unknown.
- **J12 P2** Repair history, household health trends and effectiveness statistics.
- **J13 P2** Multiple languages and beginner/expert modes.
- **J14 P2** Anonymized comparison against user-approved benchmark cohorts; strict privacy and minimum sample counts.

### K. Small business and professional features
- **K01 P2** Multiple sites with one status page and site-scoped permissions.
- **K02 P2** Role-based access for owner, manager and technician.
- **K03 P2** Shared incidents, assignments, comments and resolution evidence.
- **K04 P2** Asset ownership and lifecycle tracking.
- **K05 P2** Guest versus employee network policy checks.
- **K06 P2** Remote-work/VPN connectivity checks and policy inventory.
- **K07 P2** Small-business cybersecurity starter checklist aligned to NIST CSF 2.0.
- **K08 P2** Executive-readable monthly risk and uptime report.
- **K09 P3** Optional read-only Microsoft 365/Google Workspace security-posture connectors.
- **K10 P3** Ticketing/webhooks/REST API and MSP customer workspaces with strong tenant isolation.
- **K11 P3** Safe policy templates, audit logs, configuration backup and two-person approval for high-risk changes.

### L. Network-engineering power mode and lab
- **L01 P0** Read-only network inventory, diagram and per-subnet discovery limitations.
- **L02 P0** Source-backed networking glossary with beginner and advanced explanations.
- **L03 P1** Ping/traceroute/DNS/route comparison from multiple authorized vantage points.
- **L04 P1** Read-only OPNsense/Proxmox lab views with explicitly verified status.
- **L05 P1** VLAN mapping and management/client/IoT/security zone descriptions.
- **L06 P1** Reproducible DNS failure, gateway outage and packet-loss scenarios in isolated lab.
- **L07 P2** FRRouting route table/routing adjacency display and OSPF/BGP learning exercises.
- **L08 P2** Firewall rule reachability explanations and safe change simulation.
- **L09 P2** Network event correlation with separate AegisSOC, Wazuh and Suricata sources.
- **L10 P2** Incident packet-capture analysis in authorized lab with minimization and retention rules.
- **L11 P2** Versioned topology-as-code diagrams, lab validation suites and evidence artifacts.
- **L12 P2** Optional advanced 'show raw commands/logs' mode for students and technicians.

### M. Platform engineering, safety and operations
- **M01 P0** Java 21+ Spring Boot API with OpenAPI contracts and input validation.
- **M02 P0** Spring Security authentication, secure sessions or OAuth/OIDC, MFA and fine-grained authorization.
- **M03 P0** PostgreSQL tenant/site/device/measurement/finding/action/event schema with migrations.
- **M04 P0** Signed/authenticated sensor and backend communications; encryption in transit and at rest.
- **M05 P0** Least-privilege sensor, safe scan limits, outbound-only telemetry by default.
- **M06 P0** Structured logs, tracing, health checks, backup/restore and incident response for the product itself.
- **M07 P0** Unit/integration/e2e/security tests plus CI lint, typecheck, dependency scanning, SBOM and secret scanning.
- **M08 P0** Documented data retention, consent, deletion and minimal data collection.
- **M09 P1** Reliable alert/event pipeline with retry/idempotency and deduplication.
- **M10 P1** Feature flags, rollout controls, safe database migrations and rollback.
- **M11 P1** Audit log for policies and sensitive administrative changes.
- **M12 P1** Payments and trials, billing receipts, entitlement checks, subscription cancellation and grace periods.
- **M13 P1** Customer support/feedback flow and transparent limitation/incident page.
- **M14 P2** Signed agent binaries/updates, auto-update verification and reproducible packaging.
- **M15 P2** Privacy-preserving analytics and performance/error monitoring with opt-outs.
- **M16 P2** Security testing: threat model, SAST/DAST, authorization tests and independent review before broad launch.
- **M17 P2** Self-hosted/community edition with documented feature boundaries and optional paid support.

# Phase 2 architecture decisions

## P2-01 — Saved baseline defines verification boundary

An Internet Doctor incident stores the baseline verdict, evidence, and measurement window. A retest queries only measurements with `measured_at` strictly after the baseline window end and within the latest five minutes. The same samples cannot establish an improvement. Both baseline and fresh evidence are returned for comparison. At least five fresh gateway, DNS, and public measurements are required by the deterministic engine, and each group must span at least two minutes. Insufficient baseline or retest data yields `INCONCLUSIVE`.

Tradeoff: a sensor with a skewed clock can make a retest inconclusive even after new uploads. This is safer than asserting a fix from old data. A future agent protocol should report clock skew and explicit run IDs.

## P2-02 — Diagnosis needs a control measurement

DNS failure is attributed only when at least five direct public-IP checks succeeded while DNS lookups failed. Without direct-IP evidence, the engine says the cause is unclear. When all tested outside destinations fail, the language lists modem, provider, and tested services as possibilities; gateway reachability alone does not prove ISP fault.

## P2-03 — Keep the existing stack and trust boundaries

No migration or new dependency was needed for the diagnosis fix. `SiteAccess` still gates every site diagnosis route. Retests are read-only measurement analysis with a stored verification record. The agent remains outbound-only and probe targets remain explicitly configured.

## P2-04 — Coverage is evidence-limited

Coverage reads existing sensor, consent, device, and measurement records. A heartbeat alone leaves diagnostics unknown; recent gateway, DNS, and public probes are required for monitoring availability. Consented device monitoring also needs a recent observation. No control is returned as verified active because router, DNS filtering, VPN, browser, and endpoint integrations are absent. Device inventory remains passive and incomplete. The map is site-scoped through `SiteAccess`.

## P2-05 — Scam cases accept structured input only

Flyway V2 stores an incident type and server-authored checklist, plus self-reported completion times. There are no arbitrary incident notes, URLs, passwords, card numbers, or account fields. Case routes enforce site ownership and write role server-side; exports use the same scoped detail query. Cases expire after 30 days and can be deleted earlier. Guidance is deterministic and not a malware or financial-fraud detection result.

## P2-06 — Reliability periods describe samples, not uptime

The report reads at most the latest 50,000 measurements within the requested 1/7/30-day period, groups them into five-minute windows, and labels missing windows as monitoring gaps. A failure label requires at least two relevant samples; mixed or thin evidence stays partial. First and last observation times and any row-cap truncation are shown. The report cannot determine whether an ISP caused a fault. PDF saving uses the browser's print dialog, without a new server-side renderer.

## P2-07 — Helpers get a narrow grant, never household membership

Flyway V3 stores a hashed 256-bit one-time token, a `DIAGNOSTIC_SUMMARY` scope, acceptance/expiry/revocation timestamps, and helper suggestions. Acceptance is atomic. An active accepted grant is checked on each helper request. It gives access only to a dedicated helper endpoint returning current diagnosis, up to ten saved check summaries, and suggestions; it never changes `SiteAccess` or unlocks normal site routes. Owner invitation and revocation use `SiteAccess.owner`. Audit events record all key actions, including summary views; owner can inspect them. Invitations and notes purge 30 days after access ends. No remote shell, arbitrary command, or router action exists.

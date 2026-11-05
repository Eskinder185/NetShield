# Phase 2 feature status

Updated 2026-11-05. This complements the detailed baseline catalog in `../FEATURE_STATUS.md`.

| Feature | Status | Evidence and limits |
|---|---|---|
| Signed-in household and site scoping | Verified working on H2 | Existing integration tests cover cross-household reads and viewer writes. PostgreSQL remains unverified. |
| Local sensor probes and ingestion | Verified working in prior milestone; not rerun here | Prior agent tests and loopback run are recorded in `../FEATURE_STATUS.md`. No real home network was used in this milestone. |
| Internet Doctor diagnosis and saved retest | Verified working on H2 | 39 API tests; fresh-only retest and DNS evidence rules tested. No router setting is changed. |
| Before/after comparison UI | Verified working in demo tests; implemented but unverified with live sensor | Web suite 43/43. Live API returns saved baseline evidence and timestamp plus fresh samples. Real browser visual review remains. |
| Protection checklist | Verified working on H2 in prior milestone | User checkmarks are self-reported, never verified router settings. |
| Security coverage map | Verified working on H2 and demo | Eleven explicit states from sensor heartbeat, recent required probes, consent, and device observations. UI selects layers and devices. No verified active protection is claimed; capability declarations remain planned. |
| URL text assessment | Verified working in prior milestone | No arbitrary URL fetch and no reputation feed. No-warning-signs is not a safety guarantee. Demo sample links now use local scripted results and make no inspector API call. |
| Scam Rescue structured recovery cases | Verified working on H2 and demo | Eight incident types, saved steps, user-reported completion, JSON export, per-case delete, 30-day purge. No credentials or arbitrary incident text stored. Guidance remains general. |
| ISP sampled reliability timeline and printable report | Verified working on H2 and demo | 1/7/30-day views, failed-check groups, monitoring gaps, methodology, and browser Save as PDF. Capped at 50,000 latest rows with an explicit partial-data warning. Does not prove ISP fault or measure continuous uptime. |
| Trusted Helper scoped sessions | Verified working on H2 and demo | One-time 256-bit invite, 24-hour acceptance, two-hour read-only scope, owner revoke, suggestions, activity log, 30-day post-expiry purge. Separate helper API cannot access normal site routes. No email delivery or remote control. |
| PostgreSQL/Docker production path | Blocked | Docker/real PostgreSQL have not been exercised in this environment. |
| Router, DNS, VPN, endpoint integrations | Blocked | Requires verified compatible integrations and separate approval for live network access. |

“Verified working” here means local automated checks passed for the stated path. It does not imply production readiness.

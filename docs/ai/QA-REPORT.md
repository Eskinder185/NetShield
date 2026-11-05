# Phase 2 QA report

Run on 2026-11-05, Windows, JDK 17, H2 test profile. First Maven attempt used the system Java and failed (`release version 17 not supported`); setting `JAVA_HOME` to installed JDK 17 resolved it. Vite needed filesystem access to installed dependencies in this sandbox.

| Check | Result |
|---|---|
| API JUnit/Spring Boot/H2 | 49 passed, 0 failed |
| Web Vitest | 48 passed, 0 failed |
| TypeScript, ESLint, Vite build | Passed |
| Agent JUnit tests | 9 passed, 0 failed; no real network probed |
| PostgreSQL, Docker, CI | Not run |
| Live sensor and signed-in browser/a11y review | Not run |

Chrome audit of the final built demo coverage, Scam Rescue, reliability-report, and Trusted Helper pages: 24 page/viewport/theme combinations (phone, tablet, desktop; dark/light), zero axe, overflow, or undersized-target findings. Phone and desktop screenshots were reviewed by eye. Signed-in live pages, keyboard-only, and screen-reader walkthroughs remain unverified.

Regression covered immediate retest without new readings (`INCONCLUSIVE`, zero after samples), saved baseline evidence returned, an inconclusive one-burst retest, sustained fresh recovery (`VERIFIED`), and DNS failure without direct-IP evidence (`INSUFFICIENT_EVIDENCE`). Coverage tests require recent probes before showing monitoring and enforce cross-household reads. Scam tests cover saved progress, export, delete, role isolation, invalid type, and 30-day purge. The demo link test confirms sample URL analysis stays in the browser. Reliability tests cover failed outside checks, a monitoring gap, invalid range, and household isolation. Helper tests cover one-time acceptance, read-only scope, owner activity history, notes, revocation, expiry, site-data deletion, account deletion, and post-expiry purge. The web demo tests exercise each new flow and axe. Test setup supplies no-op layout APIs absent from jsdom; browser code is unaffected.

Remaining risk: the test simulates recovery by updating timestamps and does not prove an actual network repair. A future agent protocol with explicit run IDs and clock-skew detection would further strengthen verification. No real network was probed during this work.

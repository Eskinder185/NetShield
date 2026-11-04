# Decisions

| ID | Decision | Why |
|---|---|---|
| D-01 | Own git repo inside `netsheild/` on branch `feat/netshield-foundation` | The enclosing repo is the user's home directory with many unrelated dirty files; committing there would mix concerns. |
| D-02 | Java **17** target (not 21) | Only JDK 11/17 installed. Spring Boot 3.3 supports 17. Dockerfiles build/run on 21; change `java.version` when 21 is available. |
| D-03 | Maven, Spring Boot 3.3.5, **JdbcTemplate** + Flyway (no JPA) | Few tables, explicit SQL keeps tenant scoping visible and reviewable; fewer moving parts than JPA entities. |
| D-04 | Schema kept portable between PostgreSQL and H2 (PostgreSQL mode) | Lets tests and a no-Docker dev profile run without a database server. Cost: PG not exercised yet (USER_ACTIONS #1). |
| D-05 | BCrypt cost 12 (not Argon2) | Spec allows "strong bcrypt"; Argon2 needs an extra crypto dependency. |
| D-06 | Server-side sessions (HttpOnly, SameSite=Lax cookie) + cookie-to-header CSRF; sensors use bearer tokens, CSRF-exempt, and never accept a session | SPA served same-origin through a proxy. Sensor endpoints are separate and token-only. |
| D-07 | Sensor tokens: 256-bit random, SHA-256 hashed at rest | High-entropy secrets don't need a slow hash; hash prevents plaintext storage. |
| D-08 | Agent: Java, JDK-only, no dependencies | Same toolchain as the API, tiny footprint, no supply chain. Gateway probed by TCP connect (ICMP needs privileges). |
| D-09 | Devices identified by a hash of the MAC; raw MAC not stored | Privacy-minimising; vendor guess done at ingest from a small OUI table (LOW confidence). |
| D-10 | Frontend: React 18 + Vite + TypeScript + React Router + plain CSS design tokens + lucide icons; **no Tailwind / TanStack Query / RHF / Zod / shadcn** | Spec says "prefer". A small hand-rolled token system and a tiny `useAsync` hook cover current needs with fewer dependencies. Revisit if forms/caching grow. |
| D-11 | One `Workspace` interface with `demo` and `live` implementations; demo data lives only in browser memory | Guarantees demo and real data never mix and pages are shared. |
| D-12 | Scam Shield is server-side *text analysis* (no fetch); link text is sent to the NetShield API but not stored or logged | Keeps one implementation. Documented in privacy draft. Could be moved fully client-side later. |
| D-13 | No contact form submission, password reset, email, or billing | No provider configured; a fake success would be dishonest. |
| D-14 | System fonts only | No third-party font requests (privacy), good performance. |

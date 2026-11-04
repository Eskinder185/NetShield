# Actions only you can take

Nothing here blocks local development or the tests. Everything is optional unless noted.

1. **Verify on real PostgreSQL (recommended).** The Flyway migration and SQL are tested on H2 in PostgreSQL mode only. Either start Docker Desktop and run `docker compose up --build` (copy `.env.example` to `.env` first), or give the API credentials for a throw-away local database via `NETSHIELD_DB_URL / _USER / _PASSWORD`. Report any SQL differences.
2. **Start Docker Desktop** to exercise the Compose stack and Dockerfiles (never built in this session; the Docker daemon was not running).
3. **Install JDK 21 (optional).** The code compiles to Java 17 because only JDK 17 was installed; the Dockerfiles use 21. See `DECISIONS.md` D-02.
4. **Choose real network scope for any live agent run.** Defaults probe public services (1.1.1.1, 9.9.9.9, example.com) on your behalf only when *you* start the agent. Pass `--gateway` yourself; device inventory requires both the in-app consent and `--approved-cidrs`.
5. **Provide when ready (not needed now):** a domain/hosting decision, an email provider (verification, reset, alerts), a payment provider (billing), legal review of the draft policies, an independent security review, and a security-contact address.
6. **Visual QA in a real browser.** This session had no screenshot tooling configured; layout/contrast were checked with automated tests and CSS review only. See `BUILD_LOG.md`.

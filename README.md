# NetShield

*Your digital home's security & internet doctor.* An early-stage, locally runnable product: public website, interactive demo, signed-in app, Spring Boot API, PostgreSQL schema, and a safe local sensor.

> **Honest status:** see [docs/FEATURE_STATUS.md](docs/FEATURE_STATUS.md). Demo data is synthetic. Router control, family filters, VPN, email, billing and MFA are **not** implemented and are shown as unavailable in the app.

## Quick start (no Docker, no database server)

Prerequisites: JDK 17+, Maven 3.8+, Node 20+.

**Windows PowerShell**
```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'      # adjust
.\scripts\dev.ps1                                      # opens API (H2) and web windows
# or manually:
cd services\api; mvn spring-boot:run '-Dspring-boot.run.profiles=h2'
cd apps\web; npm install; npm run dev
```
**Linux / macOS**
```bash
./scripts/dev.sh
```
Open <http://127.0.0.1:5173>. Click **Try the demo** (no account needed), or **Create account** for the live workspace. API docs: <http://127.0.0.1:8080/api/docs>.

## With Docker + PostgreSQL
```bash
cp .env.example .env      # set NETSHIELD_DB_PASSWORD
docker compose up --build  # web http://127.0.0.1:8081, API http://127.0.0.1:8080 (loopback only)
```
*Not yet exercised in CI/this environment: see [docs/USER_ACTIONS_REQUIRED.md](docs/USER_ACTIONS_REQUIRED.md).*

## Connect a sensor (real measurements)
1. In the app: **Settings → Home sensor → Create sensor token** (shown once).
2. Build and run the agent on a home computer:
```bash
cd services/agent && mvn -B package -DskipTests
NETSHIELD_TOKEN=nsh_… java -jar target/netshield-agent-0.1.0.jar --api http://127.0.0.1:8080 --gateway 192.168.1.1
```
PowerShell: `$env:NETSHIELD_TOKEN='nsh_…'; java -jar target\netshield-agent-0.1.0.jar --api http://127.0.0.1:8080 --gateway 192.168.1.1`
Options: `--dns-names a,b` `--public-ips a,b` `--http-targets https://…` `--interval 60` `--once`; device inventory needs the in-app consent **and** `--device-inventory --approved-cidrs 192.168.1.0/24`. By default the agent checks 1.1.1.1, 9.9.9.9 and example.com. Pass your own targets to change that. It makes outgoing connections only and never changes your network.

## Tests
```bash
cd services/api   && mvn -B test     # 38 tests
cd services/agent && mvn -B test     # 9 tests
cd apps/web       && npm ci && npm run lint && npm run typecheck && npm test && npm run build   # 43 tests
```

## Docs
[Architecture](docs/ARCHITECTURE.md) · [API](docs/API.md) · [Threat model](docs/THREAT_MODEL.md) · [Privacy model](docs/PRIVACY_MODEL.md) · [Decisions](docs/DECISIONS.md) · [Build log](docs/BUILD_LOG.md) · [Actions needed from you](docs/USER_ACTIONS_REQUIRED.md)

## Backup / restore (PostgreSQL)
`docker compose exec db pg_dump -U netshield netshield > backup.sql` and `docker compose exec -T db psql -U netshield netshield < backup.sql`. (H2 dev data lives in `services/api/data/`, git-ignored, safe to delete.)

## Troubleshooting
- *`release version 17 not supported`*: `JAVA_HOME` points at JDK 11. Use JDK 17+.
- *Web shows "Cannot reach the NetShield server"*: start the API; the dev server proxies `/api` to `127.0.0.1:8080`.
- *Sensor stuck on "Waiting to connect"*: token not pasted fully, API unreachable from that computer, or the 7-day pairing window passed.
- *"Not enough information"*: leave the sensor running several minutes.

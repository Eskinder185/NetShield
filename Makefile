.PHONY: test api web agent up
test:
	cd services/api && mvn -B verify
	cd services/agent && mvn -B verify
	cd apps/web && npm ci && npm run lint && npm run typecheck && npm test && npm run build
api:
	cd services/api && mvn spring-boot:run -Dspring-boot.run.profiles=h2
web:
	cd apps/web && npm run dev
agent:
	cd services/agent && mvn -B package -DskipTests
up:
	docker compose up --build

# Optional. For real use, running the jar directly on a home computer is simpler and avoids container-network limits
# (inside Docker the gateway and neighbour table you see are the container's, not your home network's).
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN mvn -q -B -DskipTests package
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 netshield
COPY --from=build /src/target/netshield-agent-*.jar /app/agent.jar
USER 10001
ENTRYPOINT ["java", "-jar", "/app/agent.jar"]

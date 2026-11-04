FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 netshield
WORKDIR /app
COPY --from=build /src/target/netshield-api-*.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-jar", "app.jar"]

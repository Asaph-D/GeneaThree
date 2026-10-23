FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S geneatree && adduser -S geneatree -G geneatree
COPY --from=build /workspace/target/geneatree-0.0.1-SNAPSHOT.jar app.jar

USER geneatree
EXPOSE 8086
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

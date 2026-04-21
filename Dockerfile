# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM maven:3.9.6-eclipse-temurin-17 AS backend-builder
WORKDIR /backend
COPY pom.xml ./
# Pre-download dependencies (cached unless pom.xml changes)
RUN mvn dependency:go-offline -B
# Copy source code
COPY src ./src
# Copy built frontend into static resources
COPY --from=frontend-builder /frontend/dist ./src/main/resources/static/app
# Package the application
RUN mvn clean package -DskipTests -o

# Stage 3: Run application
FROM eclipse-temurin:17-jre
WORKDIR /app
ENV JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8"
COPY --from=backend-builder /backend/target/*.jar /app/app.jar
EXPOSE 8090
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

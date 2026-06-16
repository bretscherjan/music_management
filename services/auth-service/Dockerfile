FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install shared package deps
COPY packages/shared/package.json ./packages/shared/
RUN cd packages/shared && npm install

# Install service deps
COPY services/auth-service/package.json ./services/auth-service/
RUN cd services/auth-service && npm install

# Copy shared sources
COPY packages/shared/ ./packages/shared/

# Copy service sources
COPY services/auth-service/ ./services/auth-service/

WORKDIR /app/services/auth-service
EXPOSE 3001
CMD ["sh", "-c", "cd /app/packages/shared && npx prisma generate && rm -rf /app/services/auth-service/node_modules/@prisma /app/services/auth-service/node_modules/.prisma && ln -s /app/packages/shared/node_modules/@prisma /app/services/auth-service/node_modules/@prisma && ln -s /app/packages/shared/node_modules/.prisma /app/services/auth-service/node_modules/.prisma && cd /app/services/auth-service && node server.js"]

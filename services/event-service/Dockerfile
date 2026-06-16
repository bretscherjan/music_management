FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY packages/shared/package.json ./packages/shared/
RUN cd packages/shared && npm install
COPY services/event-service/package.json ./services/event-service/
RUN cd services/event-service && npm install
COPY packages/shared/ ./packages/shared/
COPY services/event-service/ ./services/event-service/
WORKDIR /app/services/event-service
EXPOSE 3002
CMD ["sh", "-c", "cd /app/packages/shared && npx prisma generate && rm -rf /app/services/event-service/node_modules/@prisma /app/services/event-service/node_modules/.prisma && ln -s /app/packages/shared/node_modules/@prisma /app/services/event-service/node_modules/@prisma && ln -s /app/packages/shared/node_modules/.prisma /app/services/event-service/node_modules/.prisma && cd /app/services/event-service && node server.js"]
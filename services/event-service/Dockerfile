FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY packages/shared/package.json ./packages/shared/
RUN cd packages/shared && npm install
COPY services/event-service/package.json ./services/event-service/
RUN cd services/event-service && npm install
COPY packages/shared/ ./packages/shared/
COPY services/event-service/ ./services/event-service/
RUN cd packages/shared && npx --yes prisma@5.8.0 generate
WORKDIR /app/services/event-service
EXPOSE 3002
CMD ["node", "server.js"]
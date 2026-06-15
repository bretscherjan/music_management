FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY packages/shared/package.json ./packages/shared/
RUN cd packages/shared && npm install
COPY services/chat-service/package.json ./services/chat-service/
RUN cd services/chat-service && npm install
COPY packages/shared/ ./packages/shared/
COPY services/chat-service/ ./services/chat-service/
RUN cd packages/shared && npx --yes prisma@5.8.0 generate
WORKDIR /app/services/chat-service
VOLUME ["/app/services/chat-service/chat-data"]
EXPOSE 3004
CMD ["node", "server.js"]
FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY packages/shared/package.json ./packages/shared/
RUN cd packages/shared && npm install
COPY services/file-service/package.json ./services/file-service/
RUN cd services/file-service && npm install
COPY packages/shared/ ./packages/shared/
COPY services/file-service/ ./services/file-service/
RUN cd packages/shared && npx --yes prisma@5.8.0 generate
WORKDIR /app/services/file-service
VOLUME ["/app/services/file-service/uploads"]
EXPOSE 3003
CMD ["node", "server.js"]
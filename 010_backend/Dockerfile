FROM node:20-slim AS base
WORKDIR /app

# Install dependencies and required system packages for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install all dependencies so Prisma CLI is available
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=prisma/schema.prisma

# Remove dev dependencies for production
RUN npm prune --production

EXPOSE 3004

CMD ["node", "server.js"]

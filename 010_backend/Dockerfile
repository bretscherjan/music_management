FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY . .

# Generate Prisma Client
RUN npx --yes prisma@5.8.0 generate

EXPOSE 3004

CMD ["node", "server.js"]

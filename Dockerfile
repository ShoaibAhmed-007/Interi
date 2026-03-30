# Use Node 20 Alpine
FROM node:20-alpine

# Install OpenSSL (Required for Prisma on Alpine)
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies (This creates a fresh node_modules for Linux)
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma Client (For Linux Alpine)
# Install devDeps for build step, generate client, then remove devDeps
RUN npm install --include=dev

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# Remove devDependencies to keep image small
RUN npm prune --production || true

# Re-generate Prisma client after pruning to restore the .prisma link inside @prisma/client
RUN npx prisma generate

EXPOSE 3001

# Start command: run migrations, seed (if script exists), then start app
CMD ["sh", "-c", "npx prisma migrate deploy || true && npm run prisma:seed --if-present || true && (node dist/src/main.js || node dist/src/main.cjs || node dist/src/main.mjs || node dist/src/main)"]

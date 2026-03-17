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
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client (For Linux Alpine)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 3001

# Start command: push DB schema, run seed (if script exists), then start app
CMD ["sh", "-c", "npx prisma db push && npm run prisma:seed || true && node dist/main"]

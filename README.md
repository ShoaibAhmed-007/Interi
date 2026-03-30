# my-nest-project

NestJS REST API with JWT authentication (access + refresh tokens), Prisma ORM (PostgreSQL), and optional Google/Apple OAuth sign-in.

## Infrastructure overview

This repo runs the backend and database in Docker. Prisma Studio is also run in Docker for table browsing.

**Services and ports**

- **backend** (NestJS API)
  - Image: built from local Dockerfile (Node 20 Alpine)
  - Port: 3001
  - Runs Prisma migrate deploy before starting the app
- **db** (PostgreSQL 15)
  - Port: 5432 (internal)
- **prisma** (Prisma Studio)
  - Image: built from the same Dockerfile as backend
  - Port: 5555

**Environment**

Create a `.env` file in the repo root. Minimum values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb?schema=public"
PORT=3001
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
```

Prisma config loads `.env` via `dotenv` in `prisma.config.ts`.

## Docker: run from scratch (build, migrate, run)

```bash
# Build images
docker compose build

# Apply migrations once
docker compose run --rm backend sh -lc "npx prisma migrate deploy"

# Start services (backend + db + prisma studio)
docker compose up -d
```

Open services:

- Swagger UI: http://localhost:3001/api/docs
- Prisma Studio: http://localhost:5555

## Docker: if containers are already running

```bash
# Apply migrations only
docker compose run --rm backend sh -lc "npx prisma migrate deploy"

# Restart backend if you changed code or config
docker compose restart backend
```

## Docker: one-off commands inside containers

```bash
# Generate Prisma client
docker compose run --rm backend sh -lc "npx prisma generate"

# Migrate (deploy)
docker compose run --rm backend sh -lc "npx prisma migrate deploy"

# Open Prisma Studio (exposed on 5555)
docker compose up -d prisma

# View logs
docker compose logs --tail 200 backend
docker compose logs --tail 200 prisma
```

## Local (non-Docker) run

```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Apply migrations (development)
npx prisma migrate dev --name init

# Run dev server
npm run start:dev
```

## Common commands

```bash
# Build server
npm run build

# Run production server (local)
npm run start:prod

# Stop containers
docker compose down
```
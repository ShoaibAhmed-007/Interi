# my-nest-project

NestJS REST API with JWT authentication (access + refresh tokens), Prisma ORM (PostgreSQL), and optional Google/Apple OAuth sign-in.

## Description

NestJS REST API with JWT authentication (access + refresh tokens), Prisma ORM (PostgreSQL), and optional Google/Apple OAuth sign-in.

---

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

---

## Getting started (complete run flow)

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

> If you hit peer-dependency conflicts (Nest 11 requires recent peer versions), add `--legacy-peer-deps`.

---

### 2. Create the environment file

Create a `.env` file in the project root:

```env
# PostgreSQL connection string (adjust user/password/host/db as needed)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb?schema=public"

# JWT secrets — use long, random strings in production
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret

# Optional — only needed if you enable Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Optional — only needed if you enable Apple OAuth
APPLE_CLIENT_ID=your_apple_client_id
```

---

### 3. Generate the Prisma client

```bash
npx prisma generate
```

This reads `prisma/schema.prisma` and generates the typed client used by the app.

---

### 4. Apply database migrations

```bash
npx prisma migrate dev --name init
```

This connects to the PostgreSQL database specified by `DATABASE_URL` and runs all pending migrations.
Run this command again any time you change `prisma/schema.prisma`.

---

### 5. Start the development server

```bash
npm run start:dev
```

The server starts in watch mode on **http://localhost:3000** and recompiles on every file change.

---

### 6. (Optional) Inspect the database

```bash
npx prisma studio
```

Opens a browser-based GUI at **http://localhost:5555** to browse and edit database records.

---

## API reference

| Method | Endpoint | Auth required | Description |
|--------|----------|---------------|-------------|
| `GET`  | `/auth/health` | No | Health check |
| `POST` | `/auth/signup` | No | Register a new user |
| `POST` | `/auth/signin` | No | Sign in and receive tokens |
| `POST` | `/auth/refresh` | Refresh token (Bearer) | Rotate access + refresh tokens |
| `POST` | `/auth/logout` | Access token (Bearer) | Invalidate refresh token |
| `POST` | `/auth/oauth/google` | No | Sign in via Google ID token |
| `POST` | `/auth/oauth/apple` | No | Sign in via Apple ID token |

**Signup / Signin body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret" }
```

**Token response:**
# my-nest-project

NestJS REST API with JWT authentication (access + refresh tokens), Prisma ORM (PostgreSQL), and optional Google/Apple OAuth sign-in.

## Documentation

- **Quick Start Guide** - Get started in minutes
- **API Documentation** - Swagger UI at `/api/docs`

## Prerequisites

- Node.js >= 18
- npm >= 9
- Docker & Docker Compose (optional, recommended for containerized workflows)

## Quick Start

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

If you run into peer-dependency errors, use `--legacy-peer-deps` as shown above.

### 2. Environment

Create a `.env` file at the repository root with these minimum values:

```env
# PostgreSQL connection string (relative example)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb?schema=public"

# Application port
PORT=3001

# JWT secrets — use long, random strings in production
JWT_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
```

Generate strong secrets locally:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Prisma: generate client, migrate, seed

```bash
npx prisma generate
npx prisma migrate dev --name init
# optional: npm run prisma:seed
```

This will apply migrations against the PostgreSQL database defined in `DATABASE_URL` and generate the Prisma client.

### 4. Start development server

```bash
npm run start:dev
```

Server runs at: http://localhost:3001

### 5. API docs (Swagger)

Open the Swagger UI:

http://localhost:3001/api/docs

Use `/auth/signin` to obtain a JWT and click "Authorize" to test protected endpoints.

## Docker: two run flows

Option A — step-by-step (manual control)

1. Start Prisma service (Studio + DB access):

```bash
docker compose up -d prisma
```

2. Install dependencies on host (optional):

```bash
npm install --legacy-peer-deps
```
## Quick Start
3. Generate Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate deploy
# optional: npm run prisma:seed
```

4. Start backend service:

```bash
docker compose up -d backend
```

5. Open services:

- Swagger UI: http://localhost:3001/api/docs
- Prisma Studio: http://localhost:5555

Option B — one-command (automated)

Run a single command that builds the images, runs install/generate/migrations/seeding inside the backend context, then starts services:

```bash
docker compose build && \
docker compose run --rm backend sh -lc "npm ci --legacy-peer-deps && npx prisma generate && (npx prisma migrate deploy || true) && (npm run prisma:seed || true)" && \
docker compose up -d
```

This is useful for CI or when you want a single-step bootstrap.

## Available scripts

| Script                    | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `npm run start:dev`       | Start development server (watch mode)                      |
| `npm run build`           | Compile TypeScript to `dist/`                              |
| `npm run start`           | Start production server (requires `npm run build`)         |
| `npx prisma generate`     | Generate Prisma Client from schema                         |
| `npx prisma migrate dev`  | Create & run migrations (development)                      |
| `npx prisma migrate deploy` | Apply migrations (production)                            |
| `npx prisma studio`       | Open Prisma Studio (http://localhost:5555)                 |

## API reference (high-level)

### Auth

- `POST /auth/signin` — Sign in and receive tokens
- `POST /auth/refresh` — Refresh access token
## Quick Commands (one-line sequence)

Run these in order to install, start Docker services, prepare Prisma, seed, and run the app:

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start docker services (prisma/studio if using compose)
docker compose up -d

# 3. Generate Prisma client
npx prisma generate

# 4. Create / migrate the database
npx prisma migrate dev --name init

# 5. Seed the database (if a seed script exists)
npm run prisma:seed

# 6. (Optional) Open Prisma Studio
npx prisma studio

# 7. Start the development server
npm run start:dev
```

Notes:
- If your project uses `npm run dev` instead of `npm run start:dev`, run that command to start the server.
- If you prefer the automated Docker flow, use the one-command Docker Compose example in the Docker section above.

### Public

- `GET /auth/health` — Health check
- `POST /auth/signup` — Register a new user

### Protected (require Bearer token)

- `POST /auth/logout` — Invalidate refresh token

## Database management

### Prisma Studio

```bash
npx prisma studio
```

Opens at http://localhost:5555.

## Project structure

```
src/
  main.ts
  app.module.ts
  auth/
    auth.controller.ts
    auth.service.ts
    dto/
    strategy/
    decorator/
  prisma/
    prisma.service.ts
    prisma.module.ts
prisma/
  schema.prisma
  migrations/
```

## Troubleshooting

- `Cannot find module '@prisma/client/runtime'`: run `npx prisma generate`.
- `npm install` peer-dep errors: use `npm install --legacy-peer-deps`.
- Port conflicts: set `PORT` in `.env` or stop the conflicting process.

## Testing the API

Use Swagger UI at http://localhost:3001/api/docs or cURL/Postman to exercise endpoints. Use `/auth/signin` to obtain a JWT and add it as `Authorization: Bearer <token>`.

**Try: Create a Design**

- Example using `curl` (replace `<ACCESS_TOKEN>` with a valid JWT obtained from `/auth/signin`):

```bash
# Sign in to get an access token (example)
curl -s -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret"}'

# Create a new design
curl -i -X POST http://localhost:3001/designs \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "INTERIOR",
    "originalImageUrl": "https://example.com/original.jpg",
    "resultImageUrl": "https://example.com/result.jpg",
    "location": "Living Room",
    "style": "Modern",
    "colorPalette": "High-Contrast",
    "seedUsed": null
  }'
```

## Admin seed (optional)

If the repository includes a `prisma` seed script, running it may create an admin user. Check `package.json` and `prisma/seed` for details.

---

If you want, I can now run the one-command Docker flow here and verify Swagger UI and Prisma Studio are accessible.

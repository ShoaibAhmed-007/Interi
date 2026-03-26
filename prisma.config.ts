import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    // Falls back to direct connection string if process.env isn't populated internally by Prisma Studio
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/mydb?schema=public"
  },
  // Prisma CLI supports studio port, but this key is not present in current TS types.
  studio: {
    port: 5555,
  },
} as any)
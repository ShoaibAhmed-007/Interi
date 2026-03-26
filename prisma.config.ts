import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    // Falls back to direct connection string if process.env isn't populated internally by Prisma Studio
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/mydb?schema=public"
  }
})
/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "originalImageUrl" TEXT NOT NULL,
    "resultImageUrl" TEXT,
    "location" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL,
    "seedUsed" BIGINT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Design_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "hash" TEXT,
    "refreshToken" TEXT,
    "googleId" TEXT,
    "appleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("appleId", "createdAt", "email", "googleId", "hash", "id", "name", "refreshToken", "updatedAt") SELECT "appleId", "createdAt", "email", "googleId", "hash", "id", "name", "refreshToken", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

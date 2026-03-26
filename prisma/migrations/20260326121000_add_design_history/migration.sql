-- CreateTable
CREATE TABLE "DesignHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "originalImageKey" TEXT NOT NULL,
    "resultImageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignHistory_userId_createdAt_idx" ON "DesignHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DesignHistory_designId_idx" ON "DesignHistory"("designId");

-- AddForeignKey
ALTER TABLE "DesignHistory" ADD CONSTRAINT "DesignHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignHistory" ADD CONSTRAINT "DesignHistory_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SuspicionLevel') THEN
    CREATE TYPE "SuspicionLevel" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PhotoAnalysis" (
  "id" SERIAL PRIMARY KEY,
  "authorId" INTEGER NOT NULL,
  "photoUrl" TEXT NOT NULL,
  "photoVkId" TEXT NOT NULL,
  "analysisResult" TEXT NOT NULL,
  "hasSuspicious" BOOLEAN NOT NULL DEFAULT false,
  "suspicionLevel" "SuspicionLevel" NOT NULL DEFAULT 'NONE',
  "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "confidence" DOUBLE PRECISION,
  "explanation" TEXT,
  "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhotoAnalysis_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PhotoAnalysis_authorId_photoVkId_key" ON "PhotoAnalysis"("authorId", "photoVkId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhotoAnalysis_authorId_hasSuspicious_idx" ON "PhotoAnalysis"("authorId", "hasSuspicious");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhotoAnalysis_suspicionLevel_idx" ON "PhotoAnalysis"("suspicionLevel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhotoAnalysis_analyzedAt_idx" ON "PhotoAnalysis"("analyzedAt" DESC);

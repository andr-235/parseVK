-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExportJobStatus') THEN
    CREATE TYPE "ExportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');
  END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JobLogLevel') THEN
    CREATE TYPE "JobLogLevel" AS ENUM ('info', 'warn', 'error');
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ExportJob" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "ExportJobStatus" NOT NULL DEFAULT 'PENDING',
  "params" JSONB NOT NULL,
  "vkUserId" INTEGER,
  "totalCount" INTEGER,
  "fetchedCount" INTEGER NOT NULL DEFAULT 0,
  "warning" TEXT,
  "error" TEXT,
  "xlsxPath" TEXT,
  "docxPath" TEXT,
  CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FriendRecord" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "jobId" UUID NOT NULL,
  "vkFriendId" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FriendRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FriendRecord_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ExportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JobLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "jobId" UUID NOT NULL,
  "level" "JobLogLevel" NOT NULL,
  "message" TEXT NOT NULL,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JobLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ExportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FriendRecord_jobId_idx" ON "FriendRecord"("jobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FriendRecord_vkFriendId_idx" ON "FriendRecord"("vkFriendId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobLog_jobId_idx" ON "JobLog"("jobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobLog_createdAt_idx" ON "JobLog"("createdAt" DESC);

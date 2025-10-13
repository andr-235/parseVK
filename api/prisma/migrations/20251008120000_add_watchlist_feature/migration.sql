-- CreateEnum
CREATE TYPE "CommentSource" AS ENUM ('TASK', 'WATCHLIST');

-- CreateEnum
CREATE TYPE "WatchlistStatus" AS ENUM ('ACTIVE', 'PAUSED', 'STOPPED');

-- CreateTable
CREATE TABLE "WatchlistSettings" (
    "id" SERIAL PRIMARY KEY,
    "trackAllComments" BOOLEAN NOT NULL DEFAULT false,
    "pollIntervalMinutes" INTEGER NOT NULL DEFAULT 5,
    "maxAuthors" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WatchlistAuthor" (
    "id" SERIAL PRIMARY KEY,
    "authorVkId" INTEGER NOT NULL,
    "sourceCommentId" INTEGER,
    "status" "WatchlistStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastCheckedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "foundCommentsCount" INTEGER NOT NULL DEFAULT 0,
    "monitoringStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monitoringStoppedAt" TIMESTAMP(3),
    "settingsId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchlistAuthor_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WatchlistSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchlistAuthor_authorVkId_fkey" FOREIGN KEY ("authorVkId") REFERENCES "Author"("vkUserId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchlistAuthor_sourceCommentId_fkey" FOREIGN KEY ("sourceCommentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistAuthor_authorVkId_settingsId_key" ON "WatchlistAuthor"("authorVkId", "settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistAuthor_sourceCommentId_key" ON "WatchlistAuthor"("sourceCommentId");

-- CreateIndex
CREATE INDEX "WatchlistAuthor_status_idx" ON "WatchlistAuthor"("status");

-- CreateIndex
CREATE INDEX "WatchlistAuthor_settingsId_idx" ON "WatchlistAuthor"("settingsId");

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "source" "CommentSource" NOT NULL DEFAULT 'TASK';
ALTER TABLE "Comment" ADD COLUMN "watchlistAuthorId" INTEGER;

-- CreateIndex
CREATE INDEX "Comment_watchlistAuthorId_idx" ON "Comment"("watchlistAuthorId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_watchlistAuthorId_fkey" FOREIGN KEY ("watchlistAuthorId") REFERENCES "WatchlistAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

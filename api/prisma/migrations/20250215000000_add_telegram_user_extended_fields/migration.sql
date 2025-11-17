-- AlterTable
ALTER TABLE "TelegramUser" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "restricted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "scam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "fake" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "min" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "self" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "contact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mutualContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "accessHash" TEXT,
ADD COLUMN "photoId" BIGINT,
ADD COLUMN "photoDcId" INTEGER,
ADD COLUMN "photoHasVideo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "commonChatsCount" INTEGER,
ADD COLUMN "usernames" JSONB,
ADD COLUMN "personal" JSONB,
ADD COLUMN "botInfo" JSONB,
ADD COLUMN "blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "contactRequirePremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "spam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "closeFriend" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "TelegramUser_verified_idx" ON "TelegramUser"("verified");

-- CreateIndex
CREATE INDEX "TelegramUser_deleted_idx" ON "TelegramUser"("deleted");


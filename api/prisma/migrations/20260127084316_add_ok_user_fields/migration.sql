-- AlterTable
ALTER TABLE "ExportJob" ADD COLUMN IF NOT EXISTS "okUserId" BIGINT;

-- AlterTable
ALTER TABLE "FriendRecord" ADD COLUMN IF NOT EXISTS "okFriendId" BIGINT;

-- AlterTable
ALTER TABLE "FriendRecord" ALTER COLUMN "vkFriendId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FriendRecord_okFriendId_idx" ON "FriendRecord"("okFriendId");

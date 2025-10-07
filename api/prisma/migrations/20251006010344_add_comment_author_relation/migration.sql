-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "authorVkId" INTEGER;

-- CreateIndex
CREATE INDEX "Comment_authorVkId_idx" ON "Comment"("authorVkId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorVkId_fkey" FOREIGN KEY ("authorVkId") REFERENCES "Author"("vkUserId") ON DELETE SET NULL ON UPDATE CASCADE;

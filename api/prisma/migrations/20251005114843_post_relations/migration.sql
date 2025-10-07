-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "groupId" INTEGER;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ownerId_postId_fkey" FOREIGN KEY ("ownerId", "postId") REFERENCES "Post"("ownerId", "vkPostId") ON DELETE CASCADE ON UPDATE CASCADE;

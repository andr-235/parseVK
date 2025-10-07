/*
  Warnings:

  - You are about to drop the column `content` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `published` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Post` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ownerId,vkCommentId]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ownerId,vkPostId]` on the table `Post` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fromId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publishedAt` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vkCommentId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commentsCanClose` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commentsCanOpen` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commentsCanPost` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commentsCount` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commentsGroupsCanPost` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromId` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postedAt` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vkPostId` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "content",
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "fromId" INTEGER NOT NULL,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likesCount" INTEGER,
ADD COLUMN     "ownerId" INTEGER NOT NULL,
ADD COLUMN     "parentsStack" JSONB,
ADD COLUMN     "publishedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "replyToComment" INTEGER,
ADD COLUMN     "replyToUser" INTEGER,
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "threadCount" INTEGER,
ADD COLUMN     "threadItems" JSONB,
ADD COLUMN     "vkCommentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "content",
DROP COLUMN "published",
DROP COLUMN "title",
ADD COLUMN     "commentsCanClose" BOOLEAN NOT NULL,
ADD COLUMN     "commentsCanOpen" BOOLEAN NOT NULL,
ADD COLUMN     "commentsCanPost" INTEGER NOT NULL,
ADD COLUMN     "commentsCount" INTEGER NOT NULL,
ADD COLUMN     "commentsGroupsCanPost" BOOLEAN NOT NULL,
ADD COLUMN     "fromId" INTEGER NOT NULL,
ADD COLUMN     "ownerId" INTEGER NOT NULL,
ADD COLUMN     "postedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "vkPostId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Comment_ownerId_vkCommentId_key" ON "Comment"("ownerId", "vkCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_ownerId_vkPostId_key" ON "Post"("ownerId", "vkPostId");

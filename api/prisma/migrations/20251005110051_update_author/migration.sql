/*
  Warnings:

  - You are about to drop the column `email` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Author` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vkUserId]` on the table `Author` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstName` to the `Author` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Author` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vkUserId` to the `Author` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Author_email_key";

-- AlterTable
ALTER TABLE "Author" DROP COLUMN "email",
DROP COLUMN "name",
ADD COLUMN     "canAccessClosed" BOOLEAN,
ADD COLUMN     "city" JSONB,
ADD COLUMN     "country" JSONB,
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "isClosed" BOOLEAN,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "photo100" TEXT,
ADD COLUMN     "photo200Orig" TEXT,
ADD COLUMN     "photo50" TEXT,
ADD COLUMN     "screenName" TEXT,
ADD COLUMN     "vkUserId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Author_vkUserId_key" ON "Author"("vkUserId");

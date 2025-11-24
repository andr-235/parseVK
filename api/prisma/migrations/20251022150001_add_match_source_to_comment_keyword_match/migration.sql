-- CreateEnum
CREATE TYPE "MatchSource" AS ENUM ('COMMENT', 'POST');

-- AlterTable
-- Сначала добавляем колонку source с дефолтным значением
ALTER TABLE "CommentKeywordMatch" ADD COLUMN "source" "MatchSource" NOT NULL DEFAULT 'COMMENT';

-- DropIndex
-- Удаляем старый первичный ключ
ALTER TABLE "CommentKeywordMatch" DROP CONSTRAINT "CommentKeywordMatch_pkey";

-- CreateIndex
-- Создаем новый составной первичный ключ
ALTER TABLE "CommentKeywordMatch" ADD CONSTRAINT "CommentKeywordMatch_pkey" PRIMARY KEY ("commentId", "keywordId", "source");

-- CreateIndex
-- Добавляем индекс на source
CREATE INDEX "CommentKeywordMatch_source_idx" ON "CommentKeywordMatch"("source");


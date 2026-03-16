-- CreateEnum
CREATE TYPE "KeywordFormSource" AS ENUM ('generated', 'manual');

-- CreateTable
CREATE TABLE "KeywordForm" (
    "id" SERIAL NOT NULL,
    "keywordId" INTEGER NOT NULL,
    "form" TEXT NOT NULL,
    "source" "KeywordFormSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordFormExclusion" (
    "id" SERIAL NOT NULL,
    "keywordId" INTEGER NOT NULL,
    "form" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeywordFormExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeywordForm_keywordId_form_key" ON "KeywordForm"("keywordId", "form");

-- CreateIndex
CREATE INDEX "KeywordForm_keywordId_idx" ON "KeywordForm"("keywordId");

-- CreateIndex
CREATE INDEX "KeywordForm_form_idx" ON "KeywordForm"("form");

-- CreateIndex
CREATE INDEX "KeywordForm_source_idx" ON "KeywordForm"("source");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordFormExclusion_keywordId_form_key" ON "KeywordFormExclusion"("keywordId", "form");

-- CreateIndex
CREATE INDEX "KeywordFormExclusion_keywordId_idx" ON "KeywordFormExclusion"("keywordId");

-- CreateIndex
CREATE INDEX "KeywordFormExclusion_form_idx" ON "KeywordFormExclusion"("form");

-- AddForeignKey
ALTER TABLE "KeywordForm" ADD CONSTRAINT "KeywordForm_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordFormExclusion" ADD CONSTRAINT "KeywordFormExclusion_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

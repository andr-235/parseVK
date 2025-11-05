CREATE TABLE "CommentKeywordMatch" (
    "commentId" INTEGER NOT NULL,
    "keywordId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentKeywordMatch_pkey" PRIMARY KEY ("commentId", "keywordId")
);

CREATE INDEX "CommentKeywordMatch_keywordId_idx" ON "CommentKeywordMatch"("keywordId");
CREATE INDEX "CommentKeywordMatch_commentId_idx" ON "CommentKeywordMatch"("commentId");

ALTER TABLE "CommentKeywordMatch"
  ADD CONSTRAINT "CommentKeywordMatch_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentKeywordMatch"
  ADD CONSTRAINT "CommentKeywordMatch_keywordId_fkey"
  FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Comment_createdAt_id_idx" ON "Comment"("createdAt", "id");

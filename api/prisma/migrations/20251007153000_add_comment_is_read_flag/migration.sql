-- Add persistent flag to track whether a comment has been read
ALTER TABLE "Comment"
ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;

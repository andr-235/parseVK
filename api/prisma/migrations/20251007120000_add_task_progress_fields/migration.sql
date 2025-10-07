-- Add task progress tracking fields
ALTER TABLE "Task"
  ADD COLUMN "totalItems" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "processedItems" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';

-- Initialize status for existing tasks based on completion or stored errors
UPDATE "Task"
SET "status" = CASE
  WHEN "completed" = TRUE THEN 'done'
  WHEN "description" IS NOT NULL
    AND jsonb_typeof("description"::jsonb) = 'object'
    AND ("description"::jsonb ? 'error') THEN 'failed'
  ELSE 'pending'
END;

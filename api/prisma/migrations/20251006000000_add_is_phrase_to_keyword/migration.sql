-- AlterTable
-- Check if column exists before adding (idempotent migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Keyword' AND column_name = 'isPhrase'
  ) THEN
    ALTER TABLE "Keyword" ADD COLUMN "isPhrase" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;


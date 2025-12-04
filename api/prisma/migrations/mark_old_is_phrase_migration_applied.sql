-- Script to mark old migration 20250120000000_add_is_phrase_to_keyword as applied
-- Run this in CI/CD if the migration was already applied under the old name
-- This prevents Prisma from trying to apply it again after renaming

-- Check if old migration exists in _prisma_migrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" 
    WHERE migration_name = '20250120000000_add_is_phrase_to_keyword'
  ) THEN
    -- Insert record for old migration as applied
    INSERT INTO "_prisma_migrations" (
      id,
      checksum,
      finished_at,
      migration_name,
      logs,
      rolled_back_at,
      started_at,
      applied_steps_count
    )
    VALUES (
      gen_random_uuid(),
      '', -- checksum will be calculated by Prisma
      NOW(),
      '20250120000000_add_is_phrase_to_keyword',
      NULL,
      NULL,
      NOW(),
      1
    );
  END IF;
END $$;


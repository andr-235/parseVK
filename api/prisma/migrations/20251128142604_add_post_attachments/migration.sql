-- AlterTable
-- Добавляем поле только если его еще нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Post' 
        AND column_name = 'attachments'
    ) THEN
        ALTER TABLE "Post" ADD COLUMN "attachments" JSONB;
    END IF;
END $$;

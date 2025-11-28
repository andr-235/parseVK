-- Скрипт для пометки миграции как применённой, если колонка уже существует
-- Используйте этот скрипт, если поле attachments уже добавлено вручную или через другую миграцию

DO $$
BEGIN
    -- Проверяем, существует ли колонка
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Post' 
        AND column_name = 'attachments'
    ) THEN
        -- Если колонка существует, но миграция не применена, помечаем её как применённую
        IF NOT EXISTS (
            SELECT 1 
            FROM _prisma_migrations 
            WHERE migration_name = '20251128142604_add_post_attachments'
        ) THEN
            INSERT INTO _prisma_migrations (migration_name, finished_at, applied_steps_count)
            VALUES ('20251128142604_add_post_attachments', NOW(), 1);
        END IF;
    END IF;
END $$;


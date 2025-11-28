-- Скрипт для исправления статуса миграции, если колонка уже существует
-- Этот скрипт нужно выполнить в базе данных

DO $$
BEGIN
    -- Проверяем, существует ли колонка
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Post' 
        AND column_name = 'attachments'
        AND table_schema = 'public'
    ) THEN
        -- Если колонка существует, но миграция помечена как failed или не существует
        -- Удаляем failed запись
        DELETE FROM _prisma_migrations 
        WHERE migration_name = '20251128142604_add_post_attachments' 
        AND finished_at IS NULL;
        
        -- Добавляем успешную запись
        INSERT INTO _prisma_migrations (migration_name, finished_at, applied_steps_count)
        VALUES ('20251128142604_add_post_attachments', NOW(), 1)
        ON CONFLICT (migration_name) DO UPDATE
        SET finished_at = NOW(), applied_steps_count = 1;
        
        RAISE NOTICE 'Миграция помечена как успешно применённая';
    ELSE
        -- Если колонки нет, удаляем failed запись, чтобы миграция могла выполниться
        DELETE FROM _prisma_migrations 
        WHERE migration_name = '20251128142604_add_post_attachments' 
        AND finished_at IS NULL;
        
        RAISE NOTICE 'Запись о failed миграции удалена, миграция будет выполнена заново';
    END IF;
END $$;


-- Удаление failed миграции для attachments
-- Этот скрипт удаляет запись о failed миграции из базы данных

-- Удаляем failed запись о миграции
DELETE FROM _prisma_migrations 
WHERE migration_name = '20251128142604_add_post_attachments' 
AND finished_at IS NULL;

-- Проверяем результат
SELECT 
    migration_name,
    finished_at,
    applied_steps_count
FROM _prisma_migrations 
WHERE migration_name = '20251128142604_add_post_attachments';


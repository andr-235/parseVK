#!/bin/sh
set -e

if [ ! -x "./node_modules/.bin/prisma" ]; then
  echo "Prisma CLI не найден в ./node_modules/.bin/prisma, пробуем глобальный..."
  if ! command -v prisma >/dev/null 2>&1; then
    echo "Глобальный Prisma CLI тоже не найден, останавливаемся."
    exit 1
  fi
  PRISMA_CMD="prisma"
else
  PRISMA_CMD="./node_modules/.bin/prisma"
fi

echo "Используем Prisma CLI: $PRISMA_CMD"
if ! $PRISMA_CMD migrate deploy 2>&1 | tee /tmp/migrate.log; then
  MIGRATE_ERROR=$(cat /tmp/migrate.log)
  echo "ОШИБКА: prisma migrate deploy завершился неуспешно."
  echo "Проверьте журнал /tmp/migrate.log и состояние таблицы _prisma_migrations."
  echo "Ошибка: $MIGRATE_ERROR"
  exit 1
fi

echo "Применяем tgmbase SQL-миграции..."
for migration_file in ./prisma/tgmbase-migrations/*.sql; do
  [ -f "$migration_file" ] || continue

  echo "Применяем tgmbase SQL-миграцию: $migration_file"
  if ! $PRISMA_CMD db execute \
    --config prisma.tgmbase.config.ts \
    --file "$migration_file"; then
    echo "ОШИБКА: не удалось применить tgmbase SQL-миграцию $migration_file."
    exit 1
  fi
done

echo "Миграции завершены успешно."

#!/bin/sh
set -e

DB_HOST="${DB_HOST:-$(echo "$DATABASE_URL" | sed -n 's@.*//\([^:/]*\).*@\1@p')}"
DB_PORT="${DB_PORT:-$(echo "$DATABASE_URL" | sed -n 's@.*://[^:/]*:\([0-9]*\).*@\1@p')}"
[ -z "$DB_HOST" ] && DB_HOST="db"
[ -z "$DB_PORT" ] && DB_PORT="5432"

echo "Ожидание доступности базы данных ${DB_HOST}:${DB_PORT}..."
for i in $(seq 1 30); do
  nc -z "$DB_HOST" "$DB_PORT" && break
  echo "БД недоступна, попытка $i/30..."
  sleep 2
done

if ! nc -z "$DB_HOST" "$DB_PORT"; then
  echo "База данных недоступна, останавливаемся."
  exit 1
fi

echo "Запуск миграций базы данных..."
if ! npx prisma migrate deploy; then
  echo "Ошибка при выполнении миграций, останавливаемся."
  exit 1
fi

echo "Запуск приложения..."
exec node dist/src/main.js


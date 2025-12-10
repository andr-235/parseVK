#!/bin/sh
set -e

# Парсим DATABASE_URL для извлечения хоста и порта
# Формат: postgresql://user:password@host:port/database?params
if [ -n "$DATABASE_URL" ]; then
  # Извлекаем часть после @ (host:port/database)
  AFTER_AT=$(echo "$DATABASE_URL" | sed 's/.*@//' | sed 's/[?#].*//')
  # Извлекаем хост (до : или /)
  DB_HOST="${DB_HOST:-$(echo "$AFTER_AT" | cut -d: -f1 | cut -d/ -f1)}"
  # Извлекаем порт (после : и до /)
  DB_PORT="${DB_PORT:-$(echo "$AFTER_AT" | cut -d: -f2 | cut -d/ -f1)}"
fi

# Fallback значения
[ -z "$DB_HOST" ] && DB_HOST="db"
[ -z "$DB_PORT" ] && DB_PORT="5432"

echo "DATABASE_URL: ${DATABASE_URL:+установлен (скрыт)}"
echo "Извлеченный DB_HOST: $DB_HOST"
echo "Извлеченный DB_PORT: $DB_PORT"

# Диагностика DNS (если доступно)
if command -v getent >/dev/null 2>&1; then
  echo "Проверка DNS для $DB_HOST..."
  if getent hosts "$DB_HOST" >/dev/null 2>&1; then
    echo "DNS резолвинг успешен: $(getent hosts "$DB_HOST")"
  else
    echo "Предупреждение: DNS не смог разрешить $DB_HOST, но продолжаем попытки подключения"
  fi
fi

echo "Ожидание доступности базы данных ${DB_HOST}:${DB_PORT}..."
for i in $(seq 1 30); do
  if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "База данных доступна!"
    break
  fi
  echo "БД недоступна, попытка $i/30..."
  sleep 2
done

if ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
  echo "ОШИБКА: База данных недоступна после 30 попыток, останавливаемся."
  echo "Проверьте, что сервис БД запущен и доступен по адресу ${DB_HOST}:${DB_PORT}"
  exit 1
fi

echo "Запуск миграций базы данных..."
if ! npx prisma migrate deploy; then
  echo "Ошибка при выполнении миграций, останавливаемся."
  exit 1
fi

echo "Запуск приложения..."
exec node dist/src/main.js


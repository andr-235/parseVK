#!/bin/sh
set -e

echo "Запуск миграций базы данных..."
npx prisma migrate deploy || {
  echo "Предупреждение: ошибка при выполнении миграций, продолжаем запуск..."
}

echo "Запуск приложения..."
exec node dist/src/main.js


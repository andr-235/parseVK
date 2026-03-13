#!/bin/sh
set -e

# Подстановка переменной API_URL в nginx конфиг
# Если API_URL не указан, используем значение по умолчанию
API_URL="${API_URL:-http://api:3000}"

# Заменяем ${API_URL} в nginx конфиге на реальное значение
sed -i "s|\${API_URL}|${API_URL}|g" /etc/nginx/conf.d/default.conf

echo "Nginx конфиг обновлен с API_URL: $API_URL"

# Запускаем nginx
exec nginx -g "daemon off;"

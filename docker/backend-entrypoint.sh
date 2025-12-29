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

# Fallback значения (только порт, хост должен быть указан в DATABASE_URL)
[ -z "$DB_PORT" ] && DB_PORT="5432"

# Проверка наличия DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "ОШИБКА: DATABASE_URL не установлен. Укажите его в environment переменных."
  exit 1
fi

# Проверка наличия хоста
if [ -z "$DB_HOST" ]; then
  echo "ОШИБКА: Не удалось извлечь DB_HOST из DATABASE_URL. Проверьте формат: postgresql://user:password@host:port/database"
  exit 1
fi

echo "DATABASE_URL: ${DATABASE_URL:+установлен (скрыт)}"
echo "Извлеченный DB_HOST: $DB_HOST"
echo "Извлеченный DB_PORT: $DB_PORT"

# #region agent log
LOG_FILE="/tmp/db-debug.log"
log_debug() {
  echo "[DEBUG] $1" | tee -a "$LOG_FILE" 2>/dev/null || echo "[DEBUG] $1"
}
# #endregion

log_debug "=== Начало диагностики подключения к БД ==="
log_debug "DB_HOST: $DB_HOST"
log_debug "DB_PORT: $DB_PORT"

# Проверка формата DATABASE_URL
if echo "$DATABASE_URL" | grep -q "@$DB_HOST"; then
  log_debug "DATABASE_URL содержит правильный хост"
else
  log_debug "ПРЕДУПРЕЖДЕНИЕ: DATABASE_URL может содержать другой хост"
fi

# Диагностика сетевых интерфейсов
log_debug "=== Проверка сетевых интерфейсов ==="
if command -v ip >/dev/null 2>&1; then
  ip addr show | grep -E "inet |inet6 " | while read line; do
    log_debug "Интерфейс: $line"
  done
fi

# Проверка /etc/hosts
log_debug "=== Проверка /etc/hosts ==="
if [ -f /etc/hosts ]; then
  grep -v "^#" /etc/hosts | grep -v "^$" | while read line; do
    log_debug "hosts entry: $line"
  done
fi

# Диагностика DNS (расширенная)
log_debug "=== Диагностика DNS ==="
if command -v getent >/dev/null 2>&1; then
  DNS_RESULT=$(getent hosts "$DB_HOST" 2>&1)
  if [ $? -eq 0 ]; then
    log_debug "DNS резолвинг успешен: $DNS_RESULT"
  else
    log_debug "DNS не резолвится: $DNS_RESULT"
  fi
else
  log_debug "getent недоступен"
fi

# Проверка через nslookup (если доступно)
if command -v nslookup >/dev/null 2>&1; then
  NSLOOKUP_RESULT=$(nslookup "$DB_HOST" 2>&1 || true)
  log_debug "nslookup результат: $NSLOOKUP_RESULT"
fi

# Проверка Docker сетей (если доступно)
log_debug "=== Проверка Docker окружения ==="
if [ -f /proc/self/cgroup ]; then
  CGROUP_INFO=$(cat /proc/self/cgroup | head -1)
  log_debug "Cgroup info: $CGROUP_INFO"
fi

# Попытка найти контейнеры в той же сети
if command -v hostname >/dev/null 2>&1; then
  HOSTNAME=$(hostname)
  log_debug "Hostname контейнера: $HOSTNAME"
fi

# Проверка Docker сетей через /proc/net/route
if [ -f /proc/net/route ]; then
  log_debug "=== Сетевые маршруты ==="
  cat /proc/net/route | head -5 | while read line; do
    log_debug "Route: $line"
  done
fi

# Попытка найти БД через сканирование сети (если доступны инструменты)
if command -v arp >/dev/null 2>&1; then
  log_debug "=== ARP таблица ==="
  arp -a | head -10 | while read line; do
    log_debug "ARP: $line"
  done
fi

# Проверка переменных окружения Dokploy
log_debug "=== Переменные окружения Dokploy ==="
env | grep -i "dokploy\|database\|db\|postgres" | while read line; do
  log_debug "Env: $(echo "$line" | sed 's/=.*/=****/')"
done

# Проверка доступности порта с детальной диагностикой
log_debug "=== Проверка доступности порта ==="
if command -v nc >/dev/null 2>&1; then
  NC_TEST=$(nc -z -v -w 2 "$DB_HOST" "$DB_PORT" 2>&1 || true)
  log_debug "nc test результат: $NC_TEST"
else
  log_debug "nc недоступен"
fi

# Диагностика DNS (если доступно) - для вывода в консоль
if command -v getent >/dev/null 2>&1; then
  echo "Проверка DNS для $DB_HOST..."
  if getent hosts "$DB_HOST" >/dev/null 2>&1; then
    echo "DNS резолвинг успешен: $(getent hosts "$DB_HOST")"
  else
    echo "Предупреждение: DNS не смог разрешить $DB_HOST, но продолжаем попытки подключения"
  fi
fi

echo "Ожидание доступности базы данных ${DB_HOST}:${DB_PORT}..."
SUCCESS=false
for i in $(seq 1 30); do
  # #region agent log
  log_debug "Попытка подключения $i/30 к $DB_HOST:$DB_PORT"
  # #endregion
  
  NC_ERROR=$(nc -z -v -w 2 "$DB_HOST" "$DB_PORT" 2>&1 || true)
  
  if echo "$NC_ERROR" | grep -q "succeeded\|open"; then
    echo "База данных доступна!"
    # #region agent log
    log_debug "Подключение успешно на попытке $i"
    # #endregion
    SUCCESS=true
    break
  fi
  
  # #region agent log
  log_debug "Ошибка подключения на попытке $i: $NC_ERROR"
  # #endregion
  
  echo "БД недоступна, попытка $i/30 (проверка через nc -z $DB_HOST $DB_PORT)..."
  
  # Дополнительная диагностика каждые 5 попыток
  if [ $((i % 5)) -eq 0 ]; then
    # #region agent log
    log_debug "=== Промежуточная диагностика (попытка $i) ==="
    if command -v getent >/dev/null 2>&1; then
      DNS_CHECK=$(getent hosts "$DB_HOST" 2>&1 || echo "DNS failed")
      log_debug "DNS check: $DNS_CHECK"
    fi
    # #endregion
  fi
  
  sleep 2
done

# Финальная проверка
if [ "$SUCCESS" = "false" ]; then
  echo "ОШИБКА: База данных недоступна после 30 попыток, останавливаемся."
  echo "Проверьте, что сервис БД запущен и доступен по адресу ${DB_HOST}:${DB_PORT}"
  
  # #region agent log
  log_debug "=== ФИНАЛЬНАЯ ДИАГНОСТИКА ПЕРЕД ВЫХОДОМ ==="
  log_debug "DB_HOST: $DB_HOST"
  log_debug "DB_PORT: $DB_PORT"
  log_debug "DATABASE_URL формат: $(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/g')"
  # #endregion
  
  echo "Проверка DNS: $(getent hosts "$DB_HOST" 2>/dev/null || echo 'DNS не резолвится')"
  echo "Проверка порта:"
  nc -z -v "$DB_HOST" "$DB_PORT" 2>&1 || true
  
  # #region agent log
  log_debug "=== Дополнительная диагностика ==="
  if command -v ping >/dev/null 2>&1; then
    PING_RESULT=$(ping -c 1 -W 2 "$DB_HOST" 2>&1 || echo "ping failed")
    log_debug "Ping результат: $PING_RESULT"
  fi
  
  if [ -f /etc/resolv.conf ]; then
    log_debug "DNS resolvers:"
    cat /etc/resolv.conf | grep -v "^#" | grep -v "^$" | while read line; do
      log_debug "  $line"
    done
  fi
  
  log_debug "=== Конец диагностики ==="
  echo "Полный лог диагностики сохранен в: $LOG_FILE"
  # #endregion
  
  exit 1
fi

echo "Запуск миграций базы данных..."
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
if ! $PRISMA_CMD migrate deploy; then
  echo "Ошибка при выполнении миграций, останавливаемся."
  exit 1
fi

echo "Запуск приложения..."
exec node dist/src/main.js


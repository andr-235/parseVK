#!/bin/bash

# Скрипт для ручного деплоя на сервер
# Использование: ./deploy.sh [SERVER_USER@SERVER_HOST]

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функции для красивого вывода
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка аргументов
if [ -z "$1" ]; then
    print_error "Не указан адрес сервера!"
    echo "Использование: $0 USER@SERVER_HOST [PROJECT_PATH]"
    echo "Пример: $0 deployer@192.168.1.100 /home/deployer/parseVK"
    exit 1
fi

SERVER=$1
PROJECT_PATH=${2:-"/opt/parseVK"}

print_info "Деплой на сервер: $SERVER"
print_info "Путь к проекту: $PROJECT_PATH"

# Проверка доступности сервера
print_info "Проверка доступности сервера..."
if ! ssh -o ConnectTimeout=5 "$SERVER" "echo 'Server accessible'" > /dev/null 2>&1; then
    print_error "Не удается подключиться к серверу!"
    exit 1
fi
print_info "Сервер доступен ✓"

# Деплой
print_info "Начинаем деплой..."

ssh "$SERVER" bash << EOF
    set -e

    echo -e "${GREEN}=== Переход в директорию проекта ===${NC}"
    cd $PROJECT_PATH

    echo -e "${GREEN}=== Получение последних изменений ===${NC}"
    git fetch origin
    git reset --hard origin/main

    echo -e "${GREEN}=== Остановка контейнеров ===${NC}"
    docker compose down

    echo -e "${GREEN}=== Очистка старых образов ===${NC}"
    docker image prune -af

    echo -e "${GREEN}=== Сборка и запуск контейнеров ===${NC}"
    docker compose up -d --build

    echo -e "${GREEN}=== Ожидание запуска сервисов ===${NC}"
    sleep 15

    echo -e "${GREEN}=== Проверка статуса контейнеров ===${NC}"
    docker compose ps

    echo -e "${GREEN}=== Проверка логов ===${NC}"
    docker compose logs --tail=50
EOF

if [ $? -eq 0 ]; then
    print_info "Деплой завершен успешно! ✓"
    print_info "Приложение доступно по адресу: http://$SERVER"
else
    print_error "Деплой завершился с ошибками!"
    exit 1
fi

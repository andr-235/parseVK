#!/bin/bash

# Скрипт для проверки работоспособности ClickHouse и Elasticsearch

set -e

echo "🔍 Проверка аналитических сервисов..."
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для проверки сервиса
check_service() {
    local name=$1
    local url=$2
    local expected=$3

    echo -n "Проверка $name... "

    if response=$(curl -s "$url" 2>/dev/null); then
        if [[ $response == *"$expected"* ]]; then
            echo -e "${GREEN}✓ OK${NC}"
            return 0
        else
            echo -e "${RED}✗ FAILED (unexpected response)${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED (connection error)${NC}"
        return 1
    fi
}

# Проверка ClickHouse
check_service "ClickHouse" "http://localhost:8123/ping" "Ok."

# Проверка Elasticsearch
check_service "Elasticsearch" "http://localhost:9200/_cluster/health" "cluster_name"

# Проверка API sync endpoint
check_service "Sync API" "http://localhost:3000/api/sync/status" "queue"

echo ""
echo "📊 Статистика данных:"
echo ""

# Количество записей в ClickHouse
echo -n "ClickHouse comments_analytics: "
if clickhouse_count=$(docker exec $(docker ps -qf "name=clickhouse") clickhouse-client --query "SELECT count() FROM comments_analytics" 2>/dev/null); then
    echo -e "${GREEN}$clickhouse_count записей${NC}"
else
    echo -e "${YELLOW}Не удалось получить данные${NC}"
fi

# Количество индексов в Elasticsearch
echo -n "Elasticsearch indices: "
if es_indices=$(curl -s http://localhost:9200/_cat/indices?h=index 2>/dev/null); then
    count=$(echo "$es_indices" | wc -l)
    echo -e "${GREEN}$count индексов${NC}"
    echo "$es_indices" | while read index; do
        if doc_count=$(curl -s "http://localhost:9200/$index/_count" | grep -o '"count":[0-9]*' | cut -d: -f2); then
            echo "  - $index: $doc_count документов"
        fi
    done
else
    echo -e "${YELLOW}Не удалось получить данные${NC}"
fi

echo ""
echo "🔄 Статус очереди синхронизации:"
if sync_status=$(curl -s http://localhost:3000/api/sync/status 2>/dev/null); then
    echo "$sync_status" | python3 -m json.tool 2>/dev/null || echo "$sync_status"
else
    echo -e "${YELLOW}Не удалось получить статус${NC}"
fi

echo ""
echo -e "${GREEN}✓ Проверка завершена${NC}"

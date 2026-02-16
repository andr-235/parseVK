# 🚀 Быстрый старт: ClickHouse + Elasticsearch

Краткая инструкция по запуску аналитической функциональности.

## Шаг 1: Создание volumes

```bash
# Создать Docker volumes для хранения данных
docker volume create parsevk_clickhouse_data
docker volume create parsevk_elasticsearch_data
```

## Шаг 2: Установка зависимостей

```bash
# Установить npm пакеты
cd api
bun install

# Вернуться в корень проекта
cd ..
```

## Шаг 3: Запуск сервисов

```bash
# Запустить все сервисы через Docker Compose
docker-compose up --build -d

# Дождаться полного запуска (может занять 1-2 минуты)
docker-compose logs -f api
# Дождитесь сообщений:
# - "ClickHouse client initialized"
# - "Elasticsearch client initialized"
# - Затем нажмите Ctrl+C
```

## Шаг 4: Проверка работоспособности

```bash
# Запустить скрипт проверки
./scripts/check-analytics.sh

# Или вручную проверить каждый сервис:

# ClickHouse
curl http://localhost:8123/ping
# Ожидаемый ответ: Ok.

# Elasticsearch
curl http://localhost:9200/_cluster/health
# Ожидаемый ответ: JSON с "status": "green" или "yellow"

# Sync API
curl http://localhost:3000/api/sync/status
# Ожидаемый ответ: JSON со статусом очереди и здоровьем сервисов
```

## Шаг 5: Первая синхронизация

```bash
# Запустить полную синхронизацию данных
curl -X POST http://localhost:3000/api/sync/full

# Проверить статус синхронизации
curl http://localhost:3000/api/sync/status

# Посмотреть последние jobs
curl http://localhost:3000/api/sync/jobs?limit=5
```

## ✅ Готово!

Теперь у вас работает:

- 🔄 **Автоматическая синхронизация** каждые 5 минут
- 📊 **ClickHouse** для аналитики на порту 8123
- 🔍 **Elasticsearch** для поиска на порту 9200
- 🎯 **Sync API** на `/api/sync/*`

## 📚 Что дальше?

### Проверить данные в ClickHouse

```bash
# Подключиться к CLI
docker exec -it $(docker ps -qf "name=clickhouse") clickhouse-client

# Посмотреть таблицы
SHOW TABLES;

# Посмотреть количество комментариев
SELECT count() FROM comments_analytics;

# Топ 10 авторов
SELECT
  author_name,
  sum(total_comments) as total
FROM authors_stats
GROUP BY author_name
ORDER BY total DESC
LIMIT 10;

# Выйти
exit
```

### Проверить данные в Elasticsearch

```bash
# Список индексов
curl http://localhost:9200/_cat/indices?v

# Количество документов в индексе comments
curl http://localhost:9200/comments/_count

# Простой поиск
curl -X POST http://localhost:9200/comments/_search \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "text": "какой-то текст для поиска"
      }
    },
    "size": 5
  }'
```

### Мониторинг синхронизации

```bash
# Статус
curl http://localhost:3000/api/sync/status

# Последние задачи
curl http://localhost:3000/api/sync/jobs?limit=10

# Запустить синхронизацию вручную
curl -X POST http://localhost:3000/api/sync/incremental
```

## 🔧 Настройка

### Изменить интервал автосинхронизации

Отредактируйте файл `api/src/sync/sync.cron.ts`:

```typescript
// Вместо EVERY_5_MINUTES используйте:
@Cron('*/10 * * * *') // каждые 10 минут
@Cron('0 * * * *')    // каждый час
@Cron('0 0 * * *')    // раз в день в полночь
```

### Увеличить память для Elasticsearch

Отредактируйте `docker-compose.yml`:

```yaml
elasticsearch:
  environment:
    - "ES_JAVA_OPTS=-Xms1g -Xmx1g" # вместо 512m
```

## ❓ Проблемы?

### Сервис не запускается

```bash
# Проверить логи
docker-compose logs clickhouse
docker-compose logs elasticsearch
docker-compose logs api

# Перезапустить проблемный сервис
docker-compose restart clickhouse
docker-compose restart elasticsearch
```

### Очередь синхронизации застряла

```bash
# Очистить очередь
curl -X POST http://localhost:3000/api/sync/clean

# Перезапустить API
docker-compose restart api
```

### Нет данных в аналитических хранилищах

```bash
# Проверить, что в PostgreSQL есть данные
docker exec -it $(docker ps -qf "name=db") psql -U postgres -d vk_api -c "SELECT COUNT(*) FROM \"Comment\";"

# Если данные есть, запустить полную синхронизацию
curl -X POST http://localhost:3000/api/sync/full

# Проверить статус через минуту
curl http://localhost:3000/api/sync/status
```

## 📖 Полная документация

Для более подробной информации смотрите [ANALYTICS_INTEGRATION.md](./ANALYTICS_INTEGRATION.md)

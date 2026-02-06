# Интеграция ClickHouse и Elasticsearch

Это руководство описывает новую функциональность аналитики и полнотекстового поиска в проекте parseVK.

## 📋 Обзор

Проект расширен двумя мощными системами хранения данных:

- **ClickHouse** - для аналитики и статистики (OLAP)
- **Elasticsearch** - для полнотекстового поиска по комментариям

### Архитектура синхронизации

```
PostgreSQL (source of truth)
    ↓
Cron (каждые 5 минут) → Bull Queue (Redis)
    ↓
Workers (параллельно):
├─→ ClickHouse Sync Worker
└─→ Elasticsearch Sync Worker
```

**Принцип работы:**

- PostgreSQL остается основным источником данных
- Cron запускает задачу синхронизации каждые 5 минут
- Задачи добавляются в BullMQ очередь с retry механизмом
- Workers обрабатывают инкрементальную синхронизацию (только новые/измененные записи)

## 🚀 Быстрый старт

### 1. Запуск инфраструктуры

```bash
# Создать volumes (если еще не созданы)
docker volume create parsevk_clickhouse_data
docker volume create parsevk_elasticsearch_data

# Запустить все сервисы
docker-compose up -d

# Проверить логи
docker-compose logs -f clickhouse
docker-compose logs -f elasticsearch
docker-compose logs -f api
```

### 2. Установка зависимостей (для локальной разработки)

```bash
cd api
bun install

# Проверить, что пакеты установлены
bun list | grep -E "@clickhouse/client|@elastic/elasticsearch"
```

### 3. Проверка работоспособности

```bash
# Проверить статус синхронизации
curl http://localhost:3000/api/sync/status

# Ожидаемый ответ:
# {
#   "queue": {
#     "waiting": 0,
#     "active": 0,
#     "completed": X,
#     "failed": 0
#   },
#   "health": {
#     "clickhouse": "healthy",
#     "elasticsearch": "healthy"
#   }
# }
```

## 📊 ClickHouse - Аналитика

### Таблицы

#### 1. `comments_analytics`

Денормализованная таблица для быстрой аналитики комментариев.

**Схема:**

```sql
CREATE TABLE comments_analytics (
  id UInt64,
  vk_comment_id Int64,
  vk_owner_id Int64,
  text String,
  post_id UInt64,
  author_id UInt64,
  author_vk_id Int64,
  author_name String,
  group_id Nullable(UInt64),
  group_name Nullable(String),
  task_id Nullable(UInt64),
  source Enum8('TASK' = 1, 'WATCHLIST' = 2),
  created_at DateTime,
  date Date DEFAULT toDate(created_at)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, group_id, author_id, id)
```

**Примеры запросов:**

```sql
-- Статистика комментариев по дням
SELECT
  toDate(created_at) as date,
  count() as total_comments,
  uniq(author_id) as unique_authors
FROM comments_analytics
WHERE date >= today() - 30
GROUP BY date
ORDER BY date DESC;

-- Топ групп по комментариям
SELECT
  group_name,
  count() as comments_count
FROM comments_analytics
WHERE group_id IS NOT NULL
GROUP BY group_name
ORDER BY comments_count DESC
LIMIT 10;

-- Активность по источникам
SELECT
  source,
  count() as total,
  uniq(author_id) as unique_authors
FROM comments_analytics
GROUP BY source;
```

#### 2. `authors_stats`

Агрегированная статистика по авторам.

**Схема:**

```sql
CREATE TABLE authors_stats (
  author_id UInt64,
  author_vk_id Int64,
  author_name String,
  total_comments UInt32,
  groups_count UInt32,
  first_seen DateTime,
  last_seen DateTime,
  date Date DEFAULT toDate(last_seen)
) ENGINE = ReplacingMergeTree(last_seen)
PARTITION BY toYYYYMM(date)
ORDER BY (author_vk_id, author_id)
```

**Примеры запросов:**

```sql
-- Топ 10 авторов по количеству комментариев
SELECT
  author_vk_id,
  any(author_name) as name,
  sum(total_comments) as total
FROM authors_stats
GROUP BY author_vk_id
ORDER BY total DESC
LIMIT 10;

-- Авторы, активные в последние 7 дней
SELECT
  author_name,
  total_comments,
  last_seen
FROM authors_stats
WHERE last_seen >= now() - INTERVAL 7 DAY
ORDER BY last_seen DESC;
```

#### 3. `tasks_metrics`

Метрики выполнения задач парсинга.

#### 4. `daily_activity_mv` (Materialized View)

Материализованное представление для дневной активности.

### API для работы с ClickHouse

Методы в `ClickHouseService`:

```typescript
// Получить статистику по датам
await clickhouseService.getDailyStats(startDate, endDate);

// Получить топ авторов
await clickhouseService.getTopAuthors(10);

// Проверить подключение
await clickhouseService.ping();
```

## 🔍 Elasticsearch - Полнотекстовый поиск

### Индексы

#### 1. `comments`

Индекс для полнотекстового поиска по комментариям с русской морфологией.

**Mapping:**

```json
{
  "properties": {
    "text": {
      "type": "text",
      "analyzer": "russian_analyzer"
    },
    "author_name": {
      "type": "text",
      "analyzer": "russian_analyzer"
    },
    "group_name": {
      "type": "text",
      "analyzer": "russian_analyzer"
    },
    "source": { "type": "keyword" },
    "created_at": { "type": "date" }
  }
}
```

**Анализатор:**

- Токенизатор: `standard`
- Фильтры: `lowercase`, `russian_stop`, `russian_stemmer`

#### 2. `authors`

Индекс для поиска авторов с автодополнением (completion suggester).

### API для поиска

```typescript
// Полнотекстовый поиск
const results = await elasticsearchService.searchComments({
  query: "какой-то текст",
  groupIds: [1, 2, 3], // опционально
  authorIds: [10, 20], // опционально
  source: "TASK", // опционально: TASK | WATCHLIST
  from: 0, // пагинация
  size: 20, // размер страницы
});

// Структура ответа:
// {
//   total: 150,
//   hits: [
//     {
//       id: 1,
//       text: "комментарий",
//       highlights: {
//         text: ["<mark>найденный</mark> текст"]
//       },
//       score: 1.5
//     }
//   ],
//   aggregations: {
//     by_source: { ... },
//     by_group: { ... },
//     by_author: { ... }
//   }
// }

// Автодополнение имен авторов
const suggestions = await elasticsearchService.suggestAuthors("иван", 5);
```

## 🔄 Синхронизация данных

### Автоматическая синхронизация

Выполняется **каждые 5 минут** через Cron:

```typescript
// api/src/sync/sync.cron.ts
@Cron(CronExpression.EVERY_5_MINUTES)
async triggerIncrementalSync() {
  // Добавляет задачи в BullMQ очередь
}
```

### Ручная синхронизация

#### Инкрементальная (только новые данные)

```bash
curl -X POST http://localhost:3000/api/sync/incremental

# Ответ:
# {
#   "message": "Incremental sync jobs created",
#   "jobs": {
#     "clickhouse": "job-id-1",
#     "elasticsearch": "job-id-2"
#   }
# }
```

#### Полная синхронизация (все данные)

```bash
curl -X POST http://localhost:3000/api/sync/full
```

**⚠️ Внимание:** Полная синхронизация может занять длительное время при больших объемах данных.

### Мониторинг синхронизации

#### Статус очереди

```bash
curl http://localhost:3000/api/sync/status
```

#### Последние jobs

```bash
curl http://localhost:3000/api/sync/jobs?limit=10
```

#### Очистка завершенных jobs

```bash
curl -X POST http://localhost:3000/api/sync/clean
```

## 📡 API Endpoints

### Синхронизация

| Method | Endpoint                 | Описание                                    |
| ------ | ------------------------ | ------------------------------------------- |
| POST   | `/api/sync/full`         | Запустить полную синхронизацию              |
| POST   | `/api/sync/incremental`  | Запустить инкрементальную синхронизацию     |
| GET    | `/api/sync/status`       | Получить статус очереди и здоровье сервисов |
| GET    | `/api/sync/jobs?limit=N` | Получить последние N jobs                   |
| POST   | `/api/sync/clean`        | Очистить завершенные jobs                   |

## 🔧 Конфигурация

### Переменные окружения

```env
# Redis (для BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# ClickHouse
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=parsevk_analytics
CLICKHOUSE_USER=parsevk
CLICKHOUSE_PASSWORD=clickhouse_pass

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

### Настройка интервала синхронизации

Изменить в файле `api/src/sync/sync.cron.ts`:

```typescript
// Изменить с 5 минут на любой другой интервал
@Cron(CronExpression.EVERY_5_MINUTES)
// Или использовать кастомное выражение:
@Cron('*/10 * * * *') // каждые 10 минут
```

### Настройка размера батча

В процессорах синхронизации (`api/src/sync/processors/`):

```typescript
// Изменить take: 1000 на нужный размер
const newComments = await this.prisma.comment.findMany({
  // ...
  take: 1000, // размер батча
});
```

## 🐛 Отладка и логи

### Просмотр логов

```bash
# API логи (включая sync workers)
docker-compose logs -f api

# ClickHouse логи
docker-compose logs -f clickhouse

# Elasticsearch логи
docker-compose logs -f elasticsearch
```

### Проверка здоровья сервисов

```bash
# ClickHouse
curl http://localhost:8123/ping

# Elasticsearch
curl http://localhost:9200/_cluster/health

# Sync status
curl http://localhost:3000/api/sync/status
```

### Прямое подключение к ClickHouse

```bash
# CLI клиент
docker exec -it <clickhouse_container_name> clickhouse-client

# Примеры запросов
SHOW TABLES;
SELECT count() FROM comments_analytics;
SELECT * FROM comments_analytics LIMIT 10;
```

### Прямое подключение к Elasticsearch

```bash
# Список индексов
curl http://localhost:9200/_cat/indices?v

# Количество документов
curl http://localhost:9200/comments/_count
curl http://localhost:9200/authors/_count

# Поиск (пример)
curl -X POST http://localhost:9200/comments/_search \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "text": "какой-то текст"
      }
    }
  }'
```

## 📈 Производительность

### ClickHouse

- **Партиционирование:** По месяцам (`toYYYYMM(date)`)
- **Сортировка:** Оптимизирована для типичных запросов
- **Батчинг:** Вставка по 1000 записей за раз

### Elasticsearch

- **Shards:** 1 (можно увеличить для больших объемов)
- **Replicas:** 0 (можно увеличить для отказоустойчивости)
- **Bulk indexing:** Используется для эффективной индексации

### BullMQ

- **Concurrency:** 1 worker на процессор (можно увеличить)
- **Retry:** 3 попытки с экспоненциальной задержкой
- **Batching:** 1000 записей за батч

## 🚨 Возможные проблемы

### 1. "ClickHouse connection refused"

**Решение:**

```bash
# Проверить, что контейнер запущен
docker-compose ps clickhouse

# Проверить логи
docker-compose logs clickhouse

# Перезапустить
docker-compose restart clickhouse
```

### 2. "Elasticsearch index already exists"

**Решение:**
Индексы создаются автоматически при первом запуске. Если нужно пересоздать:

```bash
# Удалить индекс
curl -X DELETE http://localhost:9200/comments

# Перезапустить API (индекс создастся заново)
docker-compose restart api
```

### 3. "Sync queue stuck"

**Решение:**

```bash
# Очистить очередь через API
curl -X POST http://localhost:3000/api/sync/clean

# Или напрямую через Redis
docker exec -it <redis_container> redis-cli FLUSHDB
```

### 4. "Out of memory"

**Решение для Elasticsearch:**

```yaml
# В docker-compose.yml увеличить heap size
environment:
  - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
```

## 📚 Дальнейшее развитие

### Фаза 2: Расширенные фичи

- [ ] API для аналитики из ClickHouse
  - Endpoint для дашбордов
  - Топ авторов, групп
  - Динамика комментариев
  - Тренды по ключевым словам

- [ ] API для поиска через Elasticsearch
  - Endpoint с highlights
  - Фасетный поиск
  - Автодополнение

- [ ] Интеграция с Grafana
  - Дашборд для метрик синхронизации
  - Визуализация аналитики из ClickHouse

- [ ] Оптимизация
  - Параллельная синхронизация батчей
  - Кеширование часто используемых запросов
  - Компрессия данных в ClickHouse

## 📖 Ссылки

- [ClickHouse Documentation](https://clickhouse.com/docs)
- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling)

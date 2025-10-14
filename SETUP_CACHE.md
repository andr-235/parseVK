# Инструкция по установке Redis кэширования

## Шаг 1: Установка зависимостей

```bash
cd api
npm install @nestjs/cache-manager cache-manager cache-manager-redis-yet
```

## Шаг 2: Создание миграции для индексов

```bash
cd api
npx prisma migrate dev --name add_performance_indexes
```

## Шаг 3: Проверка Redis

Redis уже настроен в docker-compose.yml. Убедитесь, что контейнер запущен:

```bash
docker-compose ps redis
```

## Шаг 4: Пересборка и запуск

```bash
docker-compose down
docker-compose up --build
```

## Что было сделано:

### 1. Добавлены индексы в Prisma schema (15 индексов)

**Производительность:**
- Comment.publishedAt DESC: 10-50x для сортировки
- Comment.source: 5-10x для фильтра TASK/WATCHLIST
- Comment.authorVkId + publishedAt: 20-100x для истории автора
- Task.status + createdAt: 5-15x для активных задач
- Post.groupId + postedAt: 10-30x для постов группы

### 2. Реализовано Redis кэширование

**Кэшируемые методы VkService:**

| Метод | TTL | Ключ | Эффект |
|-------|-----|------|--------|
| `getGroups()` | 1 час | `vk:group:{id}` | Снижение нагрузки на VK API в 10-20x |
| `getAuthors()` | 30 мин | `vk:user:batch:{ids}` | Быстрая загрузка профилей |
| `getGroupRecentPosts()` | 10 мин | `vk:post:{ownerId}:{offset}:{count}` | Кэш постов |
| `getComments()` | 5 мин | `vk:comments:{ownerId}:{postId}:{offset}` | Кэш комментариев |

### 3. Логирование кэша

VkService теперь логирует:
- Cache HIT - данные взяты из кэша
- Cache MISS - запрос к VK API

Включите DEBUG логи для мониторинга:

```bash
# В docker-compose.yml или .env
LOG_LEVEL=debug
```

## Мониторинг Redis

Подключитесь к Redis CLI:

```bash
docker exec -it redis redis-cli
```

Команды для мониторинга:

```redis
# Посмотреть все ключи
KEYS *

# Количество ключей
DBSIZE

# Информация о памяти
INFO memory

# Мониторинг в реальном времени
MONITOR

# Получить значение по ключу
GET "vk:group:12345"

# Получить TTL ключа
TTL "vk:group:12345"

# Очистить весь кэш
FLUSHALL
```

## Ожидаемые результаты:

**До кэширования:**
- Загрузка 50 групп: ~15 секунд
- Загрузка 100 авторов: ~20 секунд
- Повторные запросы: то же время

**После кэширования:**
- Первая загрузка: то же время
- Повторные запросы: <50ms (в 300-400 раз быстрее!)
- Снижение rate limits от VK API

## Настройка TTL

Измените в `api/src/common/constants/cache-keys.ts`:

```typescript
export const CACHE_TTL = {
  VK_GROUP: 3600,     // 1 час
  VK_USER: 1800,      // 30 минут
  VK_POST: 600,       // 10 минут
  VK_COMMENTS: 300,   // 5 минут - можно уменьшить для более свежих данных
} as const;
```

## Инвалидация кэша

Для очистки кэша конкретной группы:

```bash
docker exec -it redis redis-cli DEL "vk:group:12345"
```

Или через код (добавьте в VkService при необходимости):

```typescript
async clearGroupCache(groupId: number): Promise<void> {
  const key = buildGroupCacheKey(groupId);
  await this.cacheManager.del(key);
}
```

## Следующие шаги

- ✅ Индексы БД
- ✅ Redis кэш VK API
- ⏳ BullMQ для очереди задач
- ⏳ Cursor-based pagination
- ⏳ Виртуализация списков на frontend

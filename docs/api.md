[← Architecture](architecture.md) · [Back to README](../README.md) · [Configuration →](configuration.md)

# API Reference

> Единая точка входа — API Gateway на `http://localhost:3002`. Все запросы идут через Gateway.

## Аутентификация

- **Access Token:** `Authorization: Bearer <jwt>` header
- **Refresh Token:** HttpOnly cookie

## Архитектура Gateway

API Gateway реализован по трехуровневой архитектуре:

- **Router** (`app/modules/*/router.py`) — FastAPI-роуты, валидация через Pydantic, авторизация через `require_auth`.
- **Service** (`app/modules/*/service.py`) — бизнес-логика: трансляция payload, обогащение данных, вызов бэкендов.
- **Client** (`app/clients/*/client.py`) — типизированные HTTP-клиенты для upstream-сервисов.

Общие компоненты:

| Компонент | Описание |
|-----------|----------|
| `app/modules/_base.py` | `forward_service_request()`, `translate_gateway_error()`, `BaseGatewayService` |
| `app/core/exceptions.py` | Доменные исключения (`BackendServiceError`, `BackendUnavailableError`) |
| `app/clients/base.py` | `ServiceClient` — базовый HTTP-клиент с service_name и error mapping |

## Эндпоинты

### Identity (`/api/v1/auth`)

| Метод | Путь | Описание |
|-------|------|---------|
| POST | `/api/v1/auth/login` | Вход (email + password) |
| POST | `/api/v1/auth/refresh` | Обновление токена |
| POST | `/api/v1/auth/logout` | Выход |
| GET | `/api/v1/auth/me` | Текущий пользователь |
| PATCH | `/api/v1/auth/me/password` | Смена пароля |

### Admin users (`/api/v1/admin/users`)

Все маршруты требуют роль `admin`.

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/admin/users` | Пагинированный список пользователей |
| POST | `/api/v1/admin/users` | Создать пользователя |
| PATCH | `/api/v1/admin/users/{id}` | Изменить роль или активность |
| DELETE | `/api/v1/admin/users/{id}` | Удалить пользователя |
| POST | `/api/v1/admin/users/{id}/set-temporary-password` | Выдать временный пароль |
| POST | `/api/v1/admin/users/{id}/reset-password` | Сбросить пароль |

Параметры списка: `page`, `pageSize` (1–100), `search`, `role`,
`isActive`, `isTemporaryPassword`, `sortBy`, `sortDir`.

```json
{
  "items": [],
  "page": 1,
  "pageSize": 25,
  "total": 0,
  "totalPages": 0
}
```

Обе password-операции возвращают `{ "temporaryPassword": "..." }`.
Пароль отображается один раз и не должен логироваться или сохраняться клиентом.
Удаление, деактивация и понижение последнего активного администратора возвращают
`409 Conflict`.

### Tasks (`/api/v1/tasks`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/tasks` | Список задач парсинга |
| POST | `/api/v1/tasks` | Создать задачу |
| GET | `/api/v1/tasks/{id}` | Детали задачи |
| PATCH | `/api/v1/tasks/{id}` | Обновить задачу |
| GET | `/api/v1/tasks/automation-settings` | Настройки автоматизации |

### VK (`/api/v1/vk`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/vk/groups` | Список групп |
| GET | `/api/v1/vk/posts` | Посты группы |
| GET | `/api/v1/vk/comments` | Комментарии к посту |
| POST | `/api/v1/vk/friends/export` | Экспорт друзей |
| GET | `/api/v1/vk/friends/jobs/{id}` | Статус экспорта |
| GET | `/api/v1/vk/friends/jobs/{id}/stream` | SSE-поток экспорта |
| GET | `/api/v1/vk/friends/jobs/{id}/download` | Скачать XLSX |

### OK (`/api/v1/ok`)

| Метод | Путь | Описание |
|-------|------|---------|
| POST | `/api/v1/ok/friends/export` | Экспорт друзей |
| GET | `/api/v1/ok/friends/jobs/{id}` | Статус экспорта |
| GET | `/api/v1/ok/friends/jobs/{id}/stream` | SSE-поток экспорта |
| GET | `/api/v1/ok/friends/jobs/{id}/download` | Скачать XLSX |

### Comments (`/api/v1/comments`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/comments` | Список комментариев |
| GET | `/api/v1/comments/cursor` | Пагинация курсором |
| PATCH | `/api/v1/comments/{id}/read` | Отметить прочитанным |
| POST | `/api/v1/comments/search` | Поиск комментариев |

### Content (`/api/v1/content`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/content/authors` | Список авторов |
| GET | `/api/v1/content/posts` | Список постов |
| GET | `/api/v1/content/groups` | Список групп |
| GET | `/api/v1/content/authors/{id}` | Детали автора |

### Watchlist (`/api/v1/moderation/watchlist`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/moderation/watchlist` | Watchlist |
| POST | `/api/v1/moderation/watchlist/authors` | Добавить автора |
| GET | `/api/v1/moderation/watchlist/authors/{id}` | Детали автора |
| PATCH | `/api/v1/moderation/watchlist/settings` | Настройки мониторинга |

### Keywords (`/api/v1/moderation/keywords`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/moderation/keywords` | Список ключевых слов |
| POST | `/api/v1/moderation/keywords` | Добавить слово |
| DELETE | `/api/v1/moderation/keywords/{id}` | Удалить слово |
| GET | `/api/v1/moderation/keywords/jobs` | История загрузок |
| POST | `/api/v1/moderation/keywords/upload` | Загрузка CSV |

### Listings (`/api/v1/listings`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/listings` | Список объявлений (пагинация, фильтрация) |
| GET | `/api/v1/listings/export` | Экспорт CSV (с выбором полей) |
| PATCH | `/api/v1/listings/{id}` | Обновить объявление |
| DELETE | `/api/v1/listings/{id}` | Удалить объявление |
| POST | `/api/v1/data/import` | Импорт данных (JSON / multipart) |

Параметры списка: `page`, `pageSize`, `search`, `source`, `archived`, `sortBy`, `sortOrder`.

```json
{
  "items": [{ "id": 1, "title": "...", "source": "avito", "price": "...", "archived": false }],
  "total": 100,
  "page": 1,
  "pageSize": 25,
  "hasMore": true,
  "sources": ["avito", "cian"]
}
```

Параметры экспорта CSV: `search`, `source`, `archived`, `all` (игнорировать фильтры), `fields` (колонки через запятую). Возвращает `text/csv; charset=utf-8` с BOM.

**POST `/api/v1/data/import`** — два режима:
- **JSON body:** объект `{ "listings": [...], "updateExisting": true }` или массив объектов
- **multipart/form-data:** поле `file` (.json), опционально `source` (добавляется всем записям), `updateExisting` (bool)

Каждый элемент импорта: `url` (обязательный), `source`, `externalId`, `title`, `description`, `price`, `currency`, `address`, `city`, `latitude`, `longitude`, `rooms`, `areaTotal`, `areaLiving`, `areaKitchen`, `floor`, `floorsTotal`, `publishedAt`, `contactName`, `contactPhone`, `images`, `sourceAuthorName`, `sourceAuthorPhone`, `sourceAuthorUrl`, `sourcePostedAt`, `sourceParsedAt`.

Ответ импорта:
```json
{
  "processed": 10,
  "created": 8,
  "updated": 2,
  "skipped": 0,
  "failed": 0,
  "errors": []
}
```

При повторном импорте существующие записи обновляются по URL, но ручные правки (manualOverrides) защищены от перезаписи.

### Telegram (`/api/v1/telegram`)

| Метод | Путь | Описание |
|-------|------|---------|
| POST | `/api/v1/telegram/dl/match` | Матчинг tgmbase |
| POST | `/api/v1/telegram/dl/import` | Импорт из Telegram |
| GET | `/api/v1/telegram/export/list` | Экспорт групп |
| GET | `/api/v1/telegram/capabilities` | Возможности сервиса |

### Monitoring (`/api/v1/monitoring`)

| Метод | Путь | Upstream | Описание |
|-------|------|----------|----------|
| GET | `/api/v1/monitoring/status` | — | Статус системы |
| GET | `/api/v1/monitoring/groups` | im-service | Список мониторинговых групп |
| POST | `/api/v1/monitoring/groups` | im-service | Создать мониторинговую группу |
| PATCH | `/api/v1/monitoring/groups/{id}` | im-service | Обновить мониторинговую группу |
| DELETE | `/api/v1/monitoring/groups/{id}` | im-service | Удалить мониторинговую группу |
| GET | `/api/v1/monitoring/messages` | content-service | Сообщения мониторинга |

Параметры списка групп: `messenger`, `search`, `category`.

Параметры сообщений: `keywords`, `sources`, `limit` (1–500), `page`, `from`.

Ответ `MonitoringGroup` теперь включает `im_group_id` — внешний ключ на `ImGroup` в `im-service`:

```json
{
  "id": 1,
  "messenger": "whatsapp",
  "chatId": "...",
  "name": "...",
  "category": "...",
  "imGroupId": 42,
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Domain Exceptions

Gateway использует трехуровневую иерархию ошибок:

```
ServiceClientHTTPError (клиент, HTTP)
  → BackendServiceError / BackendUnavailableError (сервис, домен)
    → HTTPException (роутер, FastAPI)
```

- `forward_service_request()` в `_base.py` транслирует HTTP-ошибки клиента в доменные исключения.
- Сервисы могут ловить доменные исключения для enrich-логики (graceful degradation).
- Роутеры (или `BaseGatewayService.forward()`) транслируют доменные исключения в HTTPException через `translate_gateway_error()`.

## Схема обработки запроса

```
Client (frontend) → Router → Service → Client (upstream)
                          ↓
                   translate_gateway_error() ← BackendServiceError
                          ↓
                   HTTPException (FastAPI response)
```

Service-слой ответственен за:
1. Трансляцию camelCase → snake_case для upstream
2. Обогащение ответов (авторы, группы) через параллельные вызовы content-service
3. Валидацию и обработку граничных случаев

## См. также

- [Архитектура](architecture.md) — взаимодействие сервисов
- [README](../README.md) — общая информация
- [Конфигурация](configuration.md) — переменные окружения

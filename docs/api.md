[Back to README](../README.md) · [Configuration →](configuration.md)

# API Reference

> Единая точка входа — API Gateway на `http://localhost:3002`. Все запросы идут через Gateway.

## Аутентификация

- **Access Token:** `Authorization: Bearer <jwt>` header
- **Refresh Token:** HttpOnly cookie

## Эндпоинты

### Identity (`/api/v1/auth`)

| Метод | Путь | Описание |
|-------|------|---------|
| POST | `/api/v1/auth/login` | Вход (email + password) |
| POST | `/api/v1/auth/refresh` | Обновление токена |
| POST | `/api/v1/auth/logout` | Выход |

### Tasks (`/api/v1/tasks`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/tasks` | Список задач парсинга |
| POST | `/api/v1/tasks` | Создать задачу |
| GET | `/api/v1/tasks/{id}` | Детали задачи |
| PATCH | `/api/v1/tasks/{id}` | Обновить задачу |

### VK (`/api/v1/vk`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/vk/groups` | Список групп |
| GET | `/api/v1/vk/posts` | Посты группы |
| GET | `/api/v1/vk/comments` | Комментарии к посту |

### Moderation (`/api/v1/moderation`)

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/moderation/watchlist` | Watchlist |
| GET | `/api/v1/moderation/keywords` | Ключевые слова |
| POST | `/api/v1/moderation/analyze` | Анализ фото |

## См. также

- [Архитектура](../.ai-factory/ARCHITECTURE.md) — взаимодействие сервисов
- [README](../README.md) — общая информация

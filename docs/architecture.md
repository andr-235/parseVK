[← Getting Started](getting-started.md) · [Back to README](../README.md) · [API Reference →](api.md)

# Архитектура

> Микросервисная архитектура: 9 FastAPI-сервисов + React-фронтенд. Асинхронная коммуникация через Kafka, синхронная — HTTP через API Gateway.

## Общая схема

```
Frontend (React/Vite) → API Gateway → Identity / Tasks / Content / Moderation / Telegram / IM / VK / Listings
                                                                                                ↕
                                                                                              Kafka
```

- **Kafka-топики:** `parsevk.tasks.events`, `parsevk.vk.events`, `parsevk.im.events`
- **PostgreSQL:** 8 отдельных баз данных (по одной на сервис)

## Стек

| Слой | Технологии |
|------|-----------|
| Бэкенд | Python 3.12+, FastAPI, SQLAlchemy 2.0 async, asyncpg, Pydantic v2, Alembic, aiokafka, httpx |
| Фронтенд | React 19, Vite 8, Tailwind CSS 4, TanStack Query, Zustand, TypeScript 6, Vitest |
| Инфра | PostgreSQL 16, Kafka 4.1, Redis 7.4, Prometheus, Grafana |
| Инструменты | Docker Compose, uv, Bun, Go (parsevkctl) |
| CI/CD | GitHub Actions, Semantic Release |

## Микросервисы

| Сервис | Назначение |
|--------|-----------|
| **api-gateway** | Единая точка входа, проксирование запросов |
| **identity-service** | Аутентификация (JWT), пользователи, роли |
| **tasks-service** | Оркестрация задач парсинга |
| **vk-service** | Интеграция с API ВКонтакте |
| **content-service** | Хранилище авторов и групп |
| **telegram-service** | Клиент Telegram (Telethon), импорт и матчинг |
| **listings-service** | Объявления и выгрузка CSV |
| **moderation-service** | Пайплайн модерации контента |
| **im-service** | Интеграция с мессенджерами (WhatsApp, Wappi.pro) |

## Трёхслойная архитектура сервиса

Каждый сервис следует паттерну **Router → Service → Repository**:

```
services/<name>/
  app/
    core/         # config (pydantic-settings), dependencies, exceptions
    modules/      # feature-модули (router, service, repository, schemas)
    api/          # presentation layer (routers, schemas) — альтернатива modules
    services/     # business logic layer
    domain/       # domain entities + repository interfaces
    infrastructure/  # adapters (DB, HTTP clients, Kafka)
    db/           # SQLAlchemy models, session factory
    tasks/        # background workers (Kafka consumer, outbox)
    main.py       # FastAPI app factory / create_app()
  alembic/        # миграции
  tests/
  pyproject.toml
  Dockerfile
```

- **Router** — FastAPI-роуты, валидация Pydantic, авторизация
- **Service** — бизнес-логика, оркестрация вызовов
- **Repository** — чтение/запись данных (SQLAlchemy)

> Некоторые сервисы (например, `vk-service`) используют **слоистую архитектуру** (Layered Architecture) вместо модульной: Presentation → Business Logic → Domain → Infrastructure. Это обеспечивает строгое разделение ответственности и Dependency Rule.

Все сервисы билдятся через **Hatchling**. Общая библиотека — `libs/py/common/` (shared schemas, модели SQLAlchemy, исключения, Kafka-хелперы). Базовый класс Pydantic-схем — `CamelModel` из `common.schemas` (авто-трансляция camelCase ↔ snake_case).

### Docker-образы

| Сервис | Базовый образ |
|--------|-------------|
| Python-микросервисы | `python:3.12.13-slim` + `uv:0.11.6` (multi-stage) |
| Фронтенд (build) | `oven/bun:1-alpine` → **production:** `nginx:alpine` |

Порты наружу: 3002 (gateway), 8080 (frontend), 3001 (grafana), 9090 (prometheus). Остальные — внутри Docker-сети.

## API Gateway

Gateway реализован по той же трёхслойной схеме, но вместо Repository использует **Client** — типизированные HTTP-клиенты для upstream-сервисов.

```
Client (frontend) → Router → Service → Client (upstream)
                          ↓
                   translate_gateway_error() ← BackendServiceError
                          ↓
                   HTTPException (FastAPI response)
```

## Data Flow

1. Фронтенд отправляет запрос в API Gateway
2. Gateway валидирует, авторизует, транслирует camelCase → snake_case
3. Service-слой обогащает ответы (авторы, группы) через параллельные вызовы
4. Для долгих операций — Kafka-события (tasks, vk, im)
5. Каждый сервис владеет своей БД, доступ к чужим данным только через API

## Git-процесс

```
Issue → Task-ветка → Реализация → PR → Review → Merge
```

- **Default branch:** `fastapi-microservices-rewrite`
- **Ветки:** `<type>/<issue-number>-<short-summary>` (напр. `feat/127-moderation-service`). AI-ветки: `ai/mbp-<issue-number>-<slug>`
- **Коммиты:** Conventional Commits на английском:
  ```
  feat(vk-service): add wall post pagination
  fix(api-gateway): handle empty refresh token
  chore(deps): bump aiokafka to 0.14
  ```

**CLI автоматизации (parsevkctl):**

```
cd tools/parsevkctl-go
go run ./cmd/parsevkctl task create "Title" --body "desc"
go run ./cmd/parsevkctl task start ISSUE_NUMBER
go run ./cmd/parsevkctl task pr ISSUE_NUMBER
go run ./cmd/parsevkctl task merge ISSUE_NUMBER
```

## AI-assisted разработка

Репозиторий настроен на полный AI-цикл разработки:

| Артефакт | Назначение |
|---|---|
| `AGENTS.md` | Правила для AI-агента (Codex) |
| `.agents/skills/` | AI-скиллы (планирование, реализация, PR, merge, handoff) |
| `.opencode/` | Конфигурация AI-агентов и правила безопасности |

Все AI-инструкции — в `AGENTS.md`. Новые разработчики должны его прочитать в первую очередь.

## Антипаттерны (запрещено)

- **Бизнес-логика в Router или Repository** — только Router маршрутизирует, Repository читает/пишет, Service содержит бизнес-логику
- **Толстые сервисы** — разбивайте на модули по фичам (`app/modules/`)
- **Файлы > 100-150 строк** — требуют декомпозиции (исключение: конфиги, миграции alembic, автогенерация)
- **Синхронные цепочки сервисов** — используйте Kafka для асинхронных сценариев
- **Shared database** — каждый сервис владеет своей БД, доступ к чужим данным только через API
- **Тихие ошибки** — никогда `except: pass`, всегда логируйте причину
- **Нет идемпотентности Kafka-consumer'ов** — повторная доставка штатна, consumer должен быть идемпотентным
- **Магические числа и хардкод** — все константы в конфиг или переменные окружения
- **Нет типов** — Python-код обязан иметь type hints, Pydantic схемы для всех входящих/исходящих данных

## См. также

- [Getting Started](getting-started.md) — установка и локальная разработка
- [API Reference](api.md) — эндпоинты Gateway
- [Конфигурация](configuration.md) — переменные окружения

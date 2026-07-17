[Back to README](../README.md) · [Architecture →](architecture.md)

# Getting Started

> Быстрый старт с ParseVK: установка, настройка и локальная разработка.

## Предварительные требования

- **Docker** и **Docker Compose** (для запуска полного стека)
- **Bun 1.x** (для фронтенда)
- **uv 0.11.6** (для Python-сервисов)

## Быстрый старт (Docker)

```bash
# 1. Скопировать .env и заполнить
cp .env.example .env

# 2. Запустить полный стек
docker compose up -d
```

После запуска:
- **Frontend:** http://localhost:8080
- **API Gateway:** http://localhost:3002
- **Grafana:** http://localhost:3001 (admin / пароль из .env)
- **Prometheus:** http://localhost:9090

## Локальная разработка

### Фронтенд

```bash
cd front
bun install
bun run dev             # http://localhost:5173 (proxy на API Gateway через /api)
bun run build           # tsc -b && vite build
bun run test            # Vitest
bun run lint            # ESLint flat config
```

### Микросервис (Python)

```bash
cd services/vk-service
uv sync                          # установка зависимостей
uv run uvicorn app.main:app --reload --port 8001
```

Для сервисов с БД сначала поднять соответствующие контейнеры:

```bash
docker compose up -d vk-db kafka
```

### Пакетный менеджер uv

Проект использует **uv** (от Astral) — полная замена pip/poetry:

| Команда | Описание |
|---------|----------|
| `uv sync` | Установка + синхронизация uv.lock |
| `uv add requests` | Добавить зависимость |
| `uv remove requests` | Удалить зависимость |
| `uv lock` | Обновить lock-файл |
| `uv run pytest` | Запустить тесты |

## Команды быстрого доступа

| Команда | Где | Описание |
|---------|-----|----------|
| `docker compose up -d` | корень | Запуск всего стека |
| `bun run dev` | `front/` | Vite dev-сервер :5173 |
| `bun run build` | `front/` | TypeScript check + Vite build |
| `bun run test` | `front/` | Vitest |
| `bun run lint` | `front/` | ESLint flat config |
| `uv run pytest` | корень / сервис | Python-тесты |
| `ruff check .` | корень / сервис | Python-линтинг |
| `uv sync` | сервис | Установка зависимостей |

## Troubleshooting

**Docker не стартует:** проверьте `.env` и `docker compose logs <service>`.

**VK API ошибки:** убедитесь, что `VK_TOKEN` валидный и имеет права wall, groups, users, offline. Получить: https://vkhost.github.io

**Миграции БД не запускаются:** проверьте `docker compose ps` и `*_DATABASE_URL`.

**CI падает с ошибками про `api/` / Prisma:** CI-файл устарел — FastAPI-сервисы пока не добавлены.

## См. также

- [Архитектура](architecture.md) — структура сервисов и data flow
- [API Reference](api.md) — эндпоинты API Gateway
- [Конфигурация](configuration.md) — переменные окружения

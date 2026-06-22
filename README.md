# ParseVK — Платформа социальной аналитики

> Парсинг ВКонтакте, Telegram и WhatsApp. Мониторинг и выявление противоправных высказываний.

## Быстрый старт

```bash
cp .env.example .env
docker compose up -d
```

После запуска: **Frontend** http://localhost:8080, **API Gateway** http://localhost:3002, **Grafana** http://localhost:3001

## Пример

```bash
# Создать задачу парсинга группы ВКонтакте
curl -X POST http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "vk_group", "target": "durov"}'

# Проверить статус
curl http://localhost:3002/api/v1/tasks \
  -H "Authorization: Bearer <token>"
```

## Технологический стек

| Слой | Технологии |
|------|-----------|
| Бэкенд | Python 3.12+, FastAPI, SQLAlchemy 2.0 async, Kafka |
| Фронтенд | React 19, Vite 8, Tailwind CSS 4, TypeScript 6 |
| Базы | PostgreSQL 16.14 (8×), Redis 7.4 |
| Инфра | Docker Compose, Prometheus, Grafana |

## Документация

| Раздел | Описание |
|--------|---------|
| [Getting Started](docs/getting-started.md) | Установка, настройка, локальная разработка |
| [Архитектура](docs/architecture.md) | Микросервисы, слои, data flow |
| [API Reference](docs/api.md) | API Gateway эндпоинты |
| [Configuration](docs/configuration.md) | Переменные окружения, secrets |
| [Testing](docs/testing.md) | Тесты: pytest, vitest, go test |
| [Deploy Runbook](docs/deploy-runbook.md) | Production deployment |
| [Design System](DESIGN.md) | Дизайн-токены, тема оформления |
| [AGENTS](AGENTS.md) | AI Playbook для разработчиков |
| [PRODUCT](PRODUCT.md) | Описание продукта и пользователей |
| [ADR](docs/adr/) | Architecture Decision Records |

## Лицензия

MIT

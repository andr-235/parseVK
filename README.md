# ParseVK — Платформа социальной аналитики

> Парсинг ВКонтакте, Telegram и WhatsApp. Мониторинг и выявление противоправных высказываний.

## Быстрый старт

```bash
cp .env.example .env
docker compose up -d
```

После запуска: **Frontend** http://localhost:8080, **API Gateway** http://localhost:3002, **Grafana** http://localhost:3001

## Технологический стек

| Слой | Технологии |
|------|-----------|
| Бэкенд | Python 3.12+, FastAPI, SQLAlchemy 2.0 async, Kafka |
| Фронтенд | React 19, Vite 8, Tailwind CSS 4, TypeScript 6 |
| Базы | PostgreSQL 16.14 (6×), Redis 7.4 |
| Инфра | Docker Compose, Prometheus, Grafana |

## Документация

| Раздел | Описание |
|--------|---------|
| [Инструкции](INSTRUCTIONS.md) | Стек, архитектура, быстрый старт, разработка |
| [AGENTS](AGENTS.md) | AI Playbook для разработчиков и ассистентов |
| [API Reference](docs/api.md) | API Gateway эндпоинты |
| [Configuration](docs/configuration.md) | Переменные окружения, secrets |
| [Архитектура](.ai-factory/ARCHITECTURE.md) | Микросервисы, event-driven |
| [Testing](docs/testing.md) | Тесты: pytest, vitest, go test |
| [Deploy](docs/deploy-runbook.md) | Production deployment runbook |
| [Дизайн](DESIGN.md) | Дизайн-токены, тема оформления |
| [PRODUCT](PRODUCT.md) | Описание продукта и пользователей |
| [ADR](docs/adr/) | Architecture Decision Records |

## Лицензия

MIT

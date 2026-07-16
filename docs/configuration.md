[← API Reference](api.md) · [Back to README](../README.md) · [Testing →](testing.md)

# Configuration

> `.env` — единственный источник secrets и настроек окружения. Никогда не коммитить.

## Управление конфигом

Все сервисы используют **pydantic-settings** (`BaseSettings`) — типизировано, с валидацией на старте.

Общий принцип: каждый сервис читает только свои переменные с префиксом `{SERVICE}_*`.

## Основные переменные

| Variable | Description |
|----------|-------------|
| `POSTGRES_*` | Основная БД (общие данные) |
| `{SERVICE}_POSTGRES_*` | БД конкретного сервиса |
| `LISTINGS_DATABASE_URL` | БД сервиса объявлений (listings) |
| `TELEGRAM_SERVICE_DATABASE_URL` | БД сервиса Telegram |
| `FASTAPI_INTERNAL_SERVICE_TOKEN` | Токен для межсервисного HTTP |
| `VK_TOKEN` | VK API токен (права: wall, groups, users, offline) |
| `TELEGRAM_API_ID/HASH` | Telegram API credentials (Telethon) |
| `TASKS_AUTOMATION_SCHEDULER_ENABLED` | Включает фоновый планировщик автоматизации задач (tasks-service) |
| `VITE_*` | Frontend-переменные (Vite env) |
| `WAPPI_*` | IM-сервис (WhatsApp через Wappi.pro) |
| `VPN_SERVICE_TELEGRAM_URL` | SOCKS5-прокси для Telegram |

## Пример .env

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
LISTINGS_POSTGRES_PASSWORD=listings_dev_password_change_me
TELEGRAM_POSTGRES_PASSWORD=telegram_dev_password_change_me

# Service-specific
VK_SERVICE_VK_TOKEN=vk123...
VK_SERVICE_TASK_WORKER_ENABLED=true
VK_SERVICE_TASK_WORKER_CONCURRENCY=2
VK_SERVICE_TASK_WORKER_POLL_SECONDS=1
VK_SERVICE_TASK_LEASE_SECONDS=90
VK_SERVICE_TASK_HEARTBEAT_SECONDS=20
VK_SERVICE_TASK_TIMEOUT_SECONDS=1800
VK_SERVICE_TASK_MAX_ATTEMPTS=3
VK_SERVICE_VK_API_TIMEOUT_SECONDS=20
IDENTITY_ADMIN_PASSWORD=admin-secure-password

# Internal
FASTAPI_INTERNAL_SERVICE_TOKEN=dev-internal-token
```

`VK_SERVICE_TASK_WORKER_CONCURRENCY` ограничивает параллельный парсинг. Lease должен
быть длиннее heartbeat; просроченный lease автоматически подхватывается другим worker.
`VK_SERVICE_TASK_TIMEOUT_SECONDS` ограничивает полное время одной задачи, а
`VK_SERVICE_VK_API_TIMEOUT_SECONDS` — отдельный сетевой вызов VK.

## See Also

- [Deploy Runbook](deploy-runbook.md) — production environment setup
- [API Reference](api.md) — endpoints requiring auth headers

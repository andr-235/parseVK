# CI/CD Pipeline Documentation

## Обзор

Проект использует GitHub Actions для автоматизации CI/CD процессов. Pipeline состоит из трех основных workflow:

1. **CI** - проверка кода, тесты, сборка образов
2. **Deploy** - деплой на production сервер
3. **Release** - создание релизов
4. **Security** - сканирование безопасности
5. **Rollback** - откат деплоя

## Workflow: CI

**Файл:** `.github/workflows/ci.yml`

**Триггеры:**

- Pull Request в `main`
- Push в `main`

**Jobs:**

1. **changes** - детектирование изменений (backend/frontend)
2. **code-quality** - параллельное выполнение lint, type-check, format-check
3. **test-backend** - тесты backend с PostgreSQL и Redis
4. **test-frontend** - тесты frontend
5. **build-images** - сборка и push Docker образов в GHCR (только при push в main)

**Особенности:**

- Умное детектирование изменений - запускаются только нужные проверки
- Кэширование зависимостей (pnpm store, node_modules, Prisma Client)
- Параллельное выполнение задач для ускорения
- Docker buildx cache для ускорения сборки образов

## Workflow: Deploy

**Файл:** `.github/workflows/deploy.yml`

**Триггеры:**

- Успешное завершение CI workflow
- Ручной запуск (workflow_dispatch)

**Особенности:**

- Детектирование изменений сервисов
- Частичный деплой - обновляются только измененные сервисы
- Автоматические миграции БД при изменении схемы
- Health checks после деплоя
- Smoke tests для проверки работоспособности
- Автоматический rollback при ошибках
- Сохранение метаданных деплоя
- Экспорт метрик в Prometheus
- Уведомления в Telegram/Slack

**Шаги:**

1. Валидация окружения и переменных
2. Сохранение текущей версии для rollback
3. Обновление кода из репозитория
4. Детектирование измененных сервисов
5. Остановка контейнеров (при полном деплое)
6. Проверка портов и БД
7. Очистка старых образов
8. Запуск БД и зависимостей (при необходимости миграций)
9. Выполнение миграций БД
10. Запуск измененных контейнеров
11. Health checks
12. Smoke tests
13. Сохранение метаданных
14. Экспорт метрик
15. Отправка уведомлений

## Workflow: Release

**Файл:** `.github/workflows/release.yml`

**Триггеры:**

- Push в `main` с footer "Release: vX.Y.Z"
- Ручной запуск с указанием версии

**Процесс:**

1. Извлечение версии из коммита или input
2. Обновление версий в package.json файлах
3. Создание коммита с обновлением версий
4. Создание git tag
5. Генерация changelog
6. Push изменений и тега
7. Создание GitHub Release

## Workflow: Security

**Файл:** `.github/workflows/security.yml`

**Триггеры:**

- Pull Request в `main`
- Push в `main`
- Еженедельный schedule (понедельник)

**Jobs:**

1. **dependency-scan** - сканирование зависимостей через `npm audit`
2. **docker-scan** - сканирование Docker образов через Trivy
3. **secret-scan** - проверка на утечку секретов через Gitleaks

**Особенности:**

- Блокировка деплоя при критических уязвимостях
- Загрузка результатов в GitHub Security
- Еженедельное автоматическое сканирование

## Workflow: Rollback

**Файл:** `.github/workflows/rollback.yml`

**Триггеры:**

- Ручной запуск (workflow_dispatch)

**Параметры:**

- `target_commit` - коммит для отката (опционально, по умолчанию последний успешный)
- `skip_health_check` - пропустить health checks после rollback

**Процесс:**

1. Загрузка метаданных деплоя
2. Определение целевого коммита
3. Сохранение текущего состояния
4. Checkout целевого коммита
5. Валидация docker-compose
6. Остановка текущих контейнеров
7. Pull и запуск контейнеров из целевого коммита
8. Health checks (опционально)
9. Обновление метаданных

## Кэширование

### CI Pipeline

- **pnpm store** - кэш пакетов pnpm
- **node_modules** - кэш установленных зависимостей
- **Prisma Client** - кэш сгенерированного Prisma Client
- **Docker buildx** - кэш слоев Docker образов (type=gha)

### Docker Builds

- **BuildKit cache mounts** - кэш для node_modules и build artifacts
- **Multi-stage builds** - оптимизация размера образов
- **Layer caching** - кэширование слоев между сборками

## Метрики

Метрики деплоя экспортируются в Prometheus:

- `deployment_duration_seconds` - длительность деплоя
- `deployment_total` - общее количество деплоев
- `deployment_last_timestamp` - timestamp последнего деплоя

Файл метрик: `/opt/parseVK/.deployment-metrics.prom`

## Уведомления

Поддерживаются два канала уведомлений:

1. **Telegram** - через `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`
2. **Slack** - через `SLACK_WEBHOOK_URL`

Уведомления отправляются при:

- Успешном деплое
- Неудачном деплое
- Rollback

## Скрипты

Все вспомогательные скрипты находятся в `.github/scripts/`:

- `check-ports.sh` - проверка доступности портов
- `health-check.sh` - проверка здоровья контейнеров
- `http-health-check.sh` - HTTP health checks
- `smoke-tests.sh` - smoke tests после деплоя
- `send-notification.sh` - отправка уведомлений
- `export-metrics.sh` - экспорт метрик
- `log-helper.sh` - вспомогательные функции логирования

## Dependabot

Автоматическое обновление зависимостей настроено через `.github/dependabot.yml`:

- Еженедельные обновления (понедельник)
- Отдельные PR для backend и frontend
- Автоматические обновления Docker образов
- Автоматические обновления GitHub Actions

## Best Practices

1. **Всегда проверяйте CI перед merge** - убедитесь, что все проверки прошли
2. **Используйте semantic commits** - для автоматического определения версий релизов
3. **Не коммитьте секреты** - используйте GitHub Secrets
4. **Проверяйте security scan** - исправляйте уязвимости перед деплоем
5. **Мониторьте метрики** - следите за временем деплоя и успешностью

## Troubleshooting

### CI не запускается

- Проверьте, что изменения в правильной ветке
- Убедитесь, что workflow файлы корректны

### Деплой не запускается

- Проверьте, что CI workflow завершился успешно
- Убедитесь, что self-hosted runner доступен

### Rollback не работает

- Проверьте наличие метаданных в `/opt/parseVK/.deployment-metadata.json`
- Убедитесь, что целевой коммит существует

### Уведомления не приходят

- Проверьте настройку секретов (TELEGRAM_BOT_TOKEN, SLACK_WEBHOOK_URL)
- Проверьте логи workflow

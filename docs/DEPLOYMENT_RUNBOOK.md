# Deployment Runbook

## Подготовка к деплою

### Предварительные проверки

1. **Проверка CI статуса**

   ```bash
   # Убедитесь, что все CI проверки прошли успешно
   # Проверьте GitHub Actions для последнего коммита
   ```

2. **Проверка изменений**

   ```bash
   # Просмотрите список изменений
   git log origin/main..HEAD --oneline
   ```

3. **Проверка миграций БД**

   ```bash
   # Если есть изменения в prisma/schema.prisma
   # Убедитесь, что миграции протестированы локально
   ```

4. **Проверка секретов**
   ```bash
   # Убедитесь, что все необходимые секреты настроены в GitHub
   # VK_TOKEN, DATABASE_URL и т.д.
   ```

## Процесс деплоя

### Автоматический деплой

Деплой запускается автоматически после успешного завершения CI workflow при push в `main`.

**Шаги автоматического деплоя:**

1. Workflow `deploy.yml` запускается после успешного CI
2. Детектирование изменений сервисов
3. Обновление кода на сервере
4. Выполнение миграций (при необходимости)
5. Обновление контейнеров
6. Health checks и smoke tests
7. Отправка уведомлений

### Ручной деплой

Если нужно запустить деплой вручную:

1. Перейдите в GitHub Actions
2. Выберите workflow "Deploy to Production Server"
3. Нажмите "Run workflow"
4. Выберите ветку (обычно `main`)
5. Нажмите "Run workflow"

## Мониторинг деплоя

### Просмотр логов

```bash
# На production сервере
cd /opt/parseVK
docker compose -f docker-compose.deploy.yml logs -f api
docker compose -f docker-compose.deploy.yml logs -f frontend
```

### Проверка статуса контейнеров

```bash
docker compose -f docker-compose.deploy.yml ps
```

### Проверка health endpoints

```bash
# API health
curl http://localhost:3000/api/health

# Frontend
curl http://localhost:80
```

## Rollback

### Автоматический rollback

При ошибке деплоя автоматически выполняется rollback к предыдущей версии.

### Ручной rollback

1. Перейдите в GitHub Actions
2. Выберите workflow "Rollback Deployment"
3. Нажмите "Run workflow"
4. Укажите целевой коммит (опционально, по умолчанию последний успешный)
5. Выберите опции (например, skip_health_check)
6. Нажмите "Run workflow"

### Rollback через CLI

```bash
# На production сервере
cd /opt/parseVK

# Проверьте метаданные
cat .deployment-metadata.json

# Checkout предыдущего коммита
git checkout <previous-commit-hash>

# Перезапустите контейнеры
docker compose -f docker-compose.deploy.yml down
docker compose -f docker-compose.deploy.yml up -d --pull always
```

## Troubleshooting

### Деплой завис

**Симптомы:**

- Workflow выполняется дольше обычного
- Контейнеры не запускаются

**Решение:**

1. Проверьте логи workflow в GitHub Actions
2. Проверьте статус self-hosted runner
3. Проверьте доступность GHCR
4. Проверьте место на диске: `df -h`

### Миграции не применяются

**Симптомы:**

- Ошибки при запуске API
- Ошибки в логах о несоответствии схемы БД

**Решение:**

1. Проверьте логи миграций:
   ```bash
   docker compose -f docker-compose.deploy.yml logs api | grep -i migration
   ```
2. Проверьте статус миграций в БД:
   ```bash
   docker compose -f docker-compose.deploy.yml exec db psql -U postgres -d vk_api -c "SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;"
   ```
3. При необходимости выполните миграции вручную:
   ```bash
   docker compose -f docker-compose.deploy.yml exec api prisma migrate deploy
   ```

### Health checks не проходят

**Симптомы:**

- Health checks падают в workflow
- Контейнеры не становятся healthy

**Решение:**

1. Проверьте логи контейнеров:
   ```bash
   docker compose -f docker-compose.deploy.yml logs --tail=100 api
   ```
2. Проверьте доступность зависимостей (БД, Redis):
   ```bash
   docker compose -f docker-compose.deploy.yml exec db pg_isready
   docker compose -f docker-compose.deploy.yml exec redis redis-cli ping
   ```
3. Проверьте переменные окружения:
   ```bash
   docker compose -f docker-compose.deploy.yml exec api env | grep -E "DATABASE_URL|VK_TOKEN"
   ```

### Образы не скачиваются

**Симптомы:**

- Ошибки при pull образов из GHCR
- Timeout при подключении к GHCR

**Решение:**

1. Проверьте доступность GHCR:
   ```bash
   curl -I https://ghcr.io
   ```
2. Проверьте авторизацию:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
   ```
3. Проверьте сетевые настройки на сервере

### Контейнеры не запускаются

**Симптомы:**

- Контейнеры сразу останавливаются
- Ошибки в `docker compose ps`

**Решение:**

1. Проверьте логи:
   ```bash
   docker compose -f docker-compose.deploy.yml logs <service-name>
   ```
2. Проверьте конфигурацию:
   ```bash
   docker compose -f docker-compose.deploy.yml config
   ```
3. Проверьте порты:
   ```bash
   netstat -tuln | grep -E "3000|80|5433"
   ```

## Экстренные процедуры

### Полная остановка

```bash
cd /opt/parseVK
docker compose -f docker-compose.deploy.yml down
```

### Восстановление из backup

```bash
# Остановите контейнеры
docker compose -f docker-compose.deploy.yml down

# Восстановите БД из backup
# (процедура зависит от вашей системы backup)

# Запустите контейнеры
docker compose -f docker-compose.deploy.yml up -d
```

### Очистка и пересборка

```bash
cd /opt/parseVK

# Остановите и удалите контейнеры
docker compose -f docker-compose.deploy.yml down

# Удалите старые образы
docker image prune -a -f

# Очистите build cache
docker builder prune -a -f

# Обновите код
git pull origin main

# Запустите заново
docker compose -f docker-compose.deploy.yml up -d --build --pull always
```

## Контакты и эскалация

При критических проблемах:

1. Проверьте логи и метрики
2. Выполните rollback если необходимо
3. Создайте issue в GitHub с описанием проблемы
4. Уведомите команду через Telegram/Slack

## Полезные команды

```bash
# Просмотр метаданных деплоя
cat /opt/parseVK/.deployment-metadata.json

# Просмотр метрик
cat /opt/parseVK/.deployment-metrics.prom

# Проверка версии образа
docker images | grep parsevk

# Просмотр использования ресурсов
docker stats

# Проверка логов за последние 5 минут
docker compose -f docker-compose.deploy.yml logs --since 5m
```

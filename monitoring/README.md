# Мониторинг ParseVK

Проект включает полнофункциональную систему мониторинга на базе Prometheus и Grafana.

## Сервисы

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Node Exporter**: http://localhost:9100

## Запуск

```bash
docker-compose up prometheus grafana node-exporter
```

## Метрики приложения

### HTTP метрики

- `http_requests_total` - общее количество HTTP запросов
- `http_request_duration_seconds` - длительность HTTP запросов

### Метрики задач

- `tasks_total` - общее количество задач по статусам
- `tasks_active` - количество активных задач

### Метрики Watchlist

- `watchlist_authors_active` - количество активных авторов в watchlist

### VK API метрики

- `vk_api_requests_total` - запросы к VK API
- `vk_api_request_duration_seconds` - длительность запросов к VK API
- `vk_api_timeouts_total` - таймауты запросов к VK API
- `vk_api_retries_total` - количество повторных попыток VK API

### Redis метрики

- `redis_keys_total` - общее количество ключей
- `redis_memory_bytes` - использование памяти
- `redis_avg_ttl_seconds` - среднее время жизни ключей
- `redis_keyspace_hit_rate` - коэффициент попаданий в кэш

### Системные метрики

Node Exporter собирает стандартные системные метрики (CPU, память, диск, сеть).

## Доступ к метрикам

Метрики приложения доступны по адресу: `http://localhost:3000/api/metrics`

## Безопасность

- Эндпоинт метрик защищен middleware и доступен только из внутренней Docker сети
- Grafana имеет базовую аутентификацию (admin/admin123)

## Настройка алертов

Для настройки алертов добавьте правила в `prometheus.yml`:

```yaml
rule_files:
  - "alert_rules.yml"
```

Файл `monitoring/alert_rules.yml` уже добавлен с базовыми алертами VK API:

```yaml
groups:
  - name: parsevk
    rules:
      - alert: VkApiP95LatencyHigh
        expr: |
          histogram_quantile(
            0.95,
            sum(rate(vk_api_request_duration_seconds_bucket[5m])) by (le)
          ) > 30
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "VK API p95 превышает 30s"
          description: "p95 длительности запросов VK API > 30s в течение 10 минут"

      - alert: VkApiTimeoutRateHigh
        expr: |
          sum(rate(vk_api_timeouts_total[5m]))
            /
          sum(rate(vk_api_requests_total[5m])) > 0.05
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Высокая доля таймаутов VK API"
          description: "Доля таймаутов VK API > 5% в течение 10 минут"

      - alert: VkApiRetryRateHigh
        expr: |
          sum(rate(vk_api_retries_total[5m]))
            /
          sum(rate(vk_api_requests_total[5m])) > 0.2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Высокая доля ретраев VK API"
          description: "Доля ретраев VK API > 20% в течение 10 минут"
```

## Кастомные дашборды

Дашборды находятся в `monitoring/grafana/dashboards/`. Для создания нового дашборда:

1. Создайте JSON файл дашборда
2. Перезапустите Grafana или используйте API для импорта

## Мониторинг в production

Для production развертывания:

1. Настройте аутентификацию для Grafana
2. Настройте HTTPS
3. Настройте persistent volumes для Prometheus и Grafana
4. Настройте алерты через Alertmanager
5. Рассмотрите использование external Prometheus instance

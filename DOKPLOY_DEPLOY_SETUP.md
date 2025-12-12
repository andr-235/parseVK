# Настройка автоматического деплоя в Dokploy через GitHub Actions

## Использование Webhook URL

Этот метод использует webhook URL для запуска деплоя после успешной сборки образов в GitHub Container Registry.

### Шаги настройки

1. **Получите Webhook URL из Dokploy:**
   - Откройте ваш Docker Compose проект в Dokploy (ParseVK → fullstack)
   - Перейдите во вкладку "Deployments"
   - В логах деплоя найдите строку с "Webhook URL" или используйте refreshToken
   - Webhook URL имеет формат: `http://192.168.88.12:3000/api/deploy/<refreshToken>`
   - Текущий refreshToken: `4ILIVV_OVu3MWCksJhpSy`
   - **Итого Webhook URL:** `http://192.168.88.12:3000/api/deploy/4ILIVV_OVu3MWCksJhpSy`

2. **Добавьте секрет в GitHub:**
   - Перейдите в репозиторий на GitHub
   - Settings → Secrets and variables → Actions
   - Нажмите "New repository secret"
   - Добавьте секрет:

   | Имя секрета           | Значение                                                     | Описание                        |
   | --------------------- | ------------------------------------------------------------ | ------------------------------- |
   | `DOKPLOY_WEBHOOK_URL` | `http://192.168.88.12:3000/api/deploy/4ILIVV_OVu3MWCksJhpSy` | Webhook URL для триггера деплоя |

### Как это работает

После успешной сборки образов API и Frontend в GitHub Container Registry, workflow отправляет POST запрос на webhook URL, который триггерит деплой Docker Compose проекта в Dokploy.

**Последовательность:**

1. Push в `main` ветку
2. GitHub Actions запускает workflow
3. Собираются образы API и Frontend, пушатся в GitHub Container Registry
4. После успешной сборки отправляется POST на `DOKPLOY_WEBHOOK_URL`
5. Dokploy запускает деплой Docker Compose проекта

**Примечание:** У вас также включен `autoDeploy: true` в Dokploy, что означает, что при пуше в GitHub автоматически запускается деплой через встроенный webhook. Workflow в GitHub Actions дополнительно триггерит деплой после сборки образов, что гарантирует деплой с актуальными образами.

## Текущая конфигурация проекта

- **Compose ID:** `rQEo-wbeW7HINBzkFLhsW`
- **Refresh Token:** `4ILIVV_OVu3MWCksJhpSy`
- **Webhook URL:** `http://192.168.88.12:3000/api/deploy/4ILIVV_OVu3MWCksJhpSy`
- **Auto Deploy:** `true` - встроенный GitHub авто-деплой включен
- **Source Type:** `github`
- **Repository:** `andr-235/parseVK`
- **Branch:** `main`

## Встроенный авто-деплой GitHub

У вас включен встроенный авто-деплой в Dokploy (`autoDeploy: true`), который автоматически запускает деплой при пуше в `main` через GitHub webhook. Workflow в GitHub Actions дополнительно триггерит деплой после сборки образов, что гарантирует, что деплой произойдет только после успешной сборки новых образов в GitHub Container Registry.

## Проверка

После настройки секрета `DOKPLOY_WEBHOOK_URL`:

1. Сделайте push в `main` ветку
2. Проверьте выполнение workflow в GitHub Actions
3. В логах шага "Deploy to Dokploy" должны увидеть:
   - "Triggering deployment via webhook..."
   - "✓ Deployment triggered successfully"
4. Проверьте в Dokploy во вкладке "Deployments", что деплой запустился

## Устранение проблем

### "⚠ DOKPLOY_WEBHOOK_URL not set"

- Убедитесь, что добавили секрет `DOKPLOY_WEBHOOK_URL` в GitHub
- Проверьте правильность значения секрета

### Webhook возвращает ошибку 404

- Проверьте правильность webhook URL
- Убедитесь, что refreshToken актуален (может измениться при пересоздании проекта)
- Получите актуальный webhook URL из вкладки "Deployments" в Dokploy

### Webhook не триггерит деплой

- Проверьте логи деплоя в Dokploy
- Убедитесь, что Docker Compose проект активен
- Проверьте, что webhook URL доступен из GitHub Actions (может быть проблема с доступностью локального IP из интернета)

**Важно:** Если Dokploy находится на локальном IP (`192.168.88.12`), webhook может не работать из GitHub Actions, так как GitHub не может обратиться к локальному IP адресу. В этом случае:

- Используйте встроенный авто-деплой GitHub (уже включен)
- Или настройте туннель/прокси для доступа к Dokploy из интернета

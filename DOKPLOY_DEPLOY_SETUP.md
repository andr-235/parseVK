# Автоматический деплой в Dokploy

## Как это работает

GitHub Actions workflow собирает образы API и Frontend, затем пушит их в GitHub Container Registry. Деплой в Dokploy происходит автоматически через встроенный механизм авто-деплоя.

**Последовательность:**

1. Push в `main` ветку
2. GitHub Actions запускает workflow
3. Собираются образы API и Frontend, пушатся в GitHub Container Registry
4. Dokploy автоматически обнаруживает изменения через GitHub webhook (встроенный авто-деплой)
5. Dokploy запускает деплой Docker Compose проекта с новыми образами

**Важно:** Не нужно настраивать webhook URL в GitHub Actions, так как:

- Dokploy находится на локальном IP (`192.168.88.12`)
- GitHub Actions не может обратиться к локальному IP адресу
- Встроенный авто-деплой Dokploy работает напрямую через GitHub webhook (Dokploy сам настраивает webhook на GitHub при включении Auto Deploy)

## Текущая конфигурация проекта

- **Compose ID:** `rQEo-wbeW7HINBzkFLhsW`
- **Auto Deploy:** `true` - встроенный GitHub авто-деплой включен
- **Source Type:** `github`
- **Repository:** `andr-235/parseVK`
- **Branch:** `main`

## Встроенный авто-деплой GitHub

В Dokploy включен встроенный авто-деплой (`autoDeploy: true`), который:

- Автоматически настраивает webhook на GitHub при включении
- При пуше в `main` GitHub отправляет webhook в Dokploy
- Dokploy запускает деплой Docker Compose проекта

**Важно:** Так как Dokploy находится на локальном IP, webhook от GitHub должен быть доступен из интернета. Если у вас нет публичного IP или туннеля, авто-деплой может не работать.

## Проверка

1. Сделайте push в `main` ветку
2. Проверьте выполнение workflow в GitHub Actions (должны собраться образы)
3. Проверьте в Dokploy во вкладке "Deployments" - должен появиться новый деплой

Если деплой не запустился автоматически, запустите его вручную из интерфейса Dokploy.

## Устранение проблем

### Деплой не запускается автоматически

- Проверьте, что `autoDeploy: true` в настройках проекта Dokploy
- Убедитесь, что Dokploy доступен из интернета (для получения webhook от GitHub)
- Если Dokploy на локальном IP без публичного доступа - авто-деплой не будет работать
- В этом случае запускайте деплой вручную из интерфейса Dokploy после успешной сборки образов

### Деплой запускается, но использует старые образы

- Убедитесь, что образы собрались в GitHub Container Registry
- Проверьте, что Docker Compose использует правильные теги образов
- В Dokploy при деплое должны подтягиваться образы из `ghcr.io/andr-235/parsevk-api:latest` и `ghcr.io/andr-235/parsevk-frontend:latest`

### "No deployments found" в Dokploy

- Это нормально, если деплои ещё не запускались
- Запустите деплой вручную из интерфейса Dokploy
- После первого деплоя он появится в списке

### Деплой не запускается вручную (кнопка Deploy не работает)

**Диагностика:**

1. **Проверьте логи деплоя:**
   - Откройте проект → вкладка **"Deployments"** или **"Logs"**
   - Ищите ошибки: `unauthorized`, `authentication required`, `pull access denied`, `manifest unknown`

2. **Проверьте образы в GitHub Packages:**
   - GitHub → репозиторий → **Packages** (справа)
   - Должны быть пакеты: `parsevk-api` или `api`, `parsevk-frontend` или `frontend`
   - Проверьте тег `latest`

3. **Проверьте имя образа:**
   - GitHub Container Registry использует формат: `ghcr.io/OWNER/REPO-IMAGE:TAG` (дефис вместо слеша)
   - Все должно быть в lowercase
   - В `docker-compose.prod.yml`: `ghcr.io/andr-235/parsevk-api:latest`

4. **Проверьте видимость пакетов:**
   - Пакеты должны быть публичными или PAT должен иметь доступ
   - GitHub → Packages → Package settings → Change visibility → Public

5. **Проверьте формат имени образа:**
   - GHCR может использовать: `ghcr.io/OWNER/REPO-IMAGE:TAG`
   - Попробуйте: `ghcr.io/andr-235/parsevk-api:latest` (вместо `parseVK/api`)

**Решения:**

**1. Ручной pull на сервере:**

```bash
# На сервере с Dokploy
docker login ghcr.io -u YOUR_USERNAME -p YOUR_PAT
docker pull ghcr.io/andr-235/parseVK/api:latest
# Если работает - проблема в настройках Dokploy
# Если нет - проблема в аутентификации или имени
```

**2. Проверьте Registry в Dokploy:**

- Settings → Docker Registries
- Убедитесь, что registry `ghcr.io` существует
- Удалите и создайте заново

**3. Используйте SHA тег вместо latest:**

- В GitHub Packages найдите SHA коммита
- Используйте: `ghcr.io/andr-235/parseVK/api:sha-abc123`

**4. Уберите `pull_policy` из docker-compose:**

- Некоторые версии Docker Compose не поддерживают `pull_policy: always`
- Удалите эту строку из `docker-compose.prod.yml`

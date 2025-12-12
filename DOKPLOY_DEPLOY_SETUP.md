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
- В Dokploy при деплое должны подтягиваться образы из `ghcr.io/andr-235/parseVK/api:latest` и `ghcr.io/andr-235/parseVK/frontend:latest`

### "No deployments found" в Dokploy

- Это нормально, если деплои ещё не запускались
- Запустите деплой вручную из интерфейса Dokploy
- После первого деплоя он появится в списке

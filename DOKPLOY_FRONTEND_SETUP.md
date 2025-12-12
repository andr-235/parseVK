# Настройка фронтенда в Dokploy

## Вариант 1: Dockerfile (Рекомендуется)

### Настройки в Dokploy:

1. **Build Type**: Выберите `Dockerfile`

2. **Root Directory**: Оставьте **пустым** (корень репозитория)

3. **Dockerfile настройки:**

   **Docker File**: `docker/frontend.Dockerfile`

   ⚠️ **ВАЖНО:** БЕЗ ведущего слэша `/`!
   - ❌ Неправильно: `/docker/frontend.Dockerfile`
   - ✅ Правильно: `docker/frontend.Dockerfile`

   **Docker Context Path**: Оставьте **пустым** (по умолчанию `.` - корень репозитория)

   **Docker Build Stage**: Оставьте **пустым** (используется последний stage - production)

   **Почему:**
   - Путь с `/` Docker интерпретирует как абсолютный путь файловой системы
   - Относительный путь `docker/frontend.Dockerfile` ищется от контекста сборки (корня репозитория)

4. **Environment Variables** (вкладка Environment):

   ```
   VITE_APP_TITLE=Центр аналитики
   VITE_API_URL=/api
   VITE_DEV_MODE=false
   VITE_API_WS_URL=/socket.io
   API_URL=http://<имя-ресурса-api>:3000
   ```

   **Важно:** Замените `<имя-ресурса-api>` на реальное имя ресурса API в Dokploy (например, `parsevk-api-xxxxx`)

5. **Port**: `80` (nginx слушает на порту 80)

6. **Healthcheck** (опционально):
   ```
   CMD-SHELL: wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1
   ```

### Важно: Настройка проксирования API

Поскольку API будет отдельным приложением, нужно указать URL API через переменную окружения.

**В Environment Variables добавьте:**

```
API_URL=http://<имя-ресурса-api>:3000
```

Например, если ресурс API называется `parsevk-api-xxxxx`, то:

```
API_URL=http://parsevk-api-xxxxx:3000
```

**Или используйте внешний URL API:**

```
API_URL=http://<IP-сервера>:<порт-api>
```

**Примечание:** Entrypoint скрипт автоматически подставит `API_URL` в nginx конфиг при запуске контейнера.

## Вариант 2: Static Build (Альтернатива)

Если хотите использовать встроенный builder Dokploy:

1. **Build Type**: Выберите `Nixpacks` или `Static`

2. **Publish Directory**: `front/dist`

3. **Build Command** (если Nixpacks):

   ```
   cd front && pnpm install && pnpm run build
   ```

4. **Environment Variables**:
   ```
   VITE_APP_TITLE=Центр аналитики
   VITE_API_URL=/api
   VITE_DEV_MODE=false
   VITE_API_WS_URL=/socket.io
   ```

**Недостаток**: Нужно будет настроить проксирование API отдельно через Dokploy или использовать внешний URL.

## Рекомендация

Используйте **Вариант 1 (Dockerfile)**, так как:

- Уже настроен и протестирован
- Включает nginx с правильной конфигурацией
- Поддерживает SPA routing
- Проксирует API и WebSocket

## Переменные окружения

| Переменная        | Значение                | Описание                                         |
| ----------------- | ----------------------- | ------------------------------------------------ |
| `VITE_APP_TITLE`  | `Центр аналитики`       | Заголовок приложения                             |
| `VITE_API_URL`    | `/api`                  | Базовый URL API (относительный для прокси)       |
| `VITE_DEV_MODE`   | `false`                 | Режим разработки                                 |
| `VITE_API_WS_URL` | `/socket.io`            | URL для WebSocket соединений                     |
| `API_URL`         | `http://<имя-api>:3000` | **Обязательно!** URL API для nginx проксирования |

## Устранение проблем

### Ошибка: "cannot create /etc/dokploy/applications/.../docker/frontend.Dockerfile/docker/.env: Directory nonexistent"

**Причина:** Dokploy неправильно интерпретирует путь к Dockerfile.

**Решение:**

1. Попробуйте **Вариант C** выше (Root Directory = `docker`, Dockerfile = `frontend.Dockerfile`)
2. Или проверьте, нет ли в настройках опции "Auto-create .env" и отключите её
3. Или используйте **Вариант 2 (Static Build)** с Nixpacks

### Альтернатива: Использовать готовый образ из GitHub Container Registry

Если проблемы с Dockerfile продолжаются, можно использовать уже собранный образ:

1. **Build Type**: Выберите `Docker Image`
2. **Image**: `ghcr.io/andr-235/parsevk/frontend:latest`
3. **Port**: `80`
4. **Environment Variables**: Те же, что указаны выше

## Проверка после деплоя

1. Откройте URL фронтенда в браузере
2. Проверьте, что фронтенд загружается
3. Проверьте, что API запросы работают (откройте DevTools → Network)
4. Проверьте WebSocket соединение (если используется)

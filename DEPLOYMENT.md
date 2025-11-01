# Инструкция по деплою parseVK на Debian 12

Это детальная инструкция по настройке автоматического деплоя вашего проекта на сервер с Debian 12 через GitHub Actions.

## Содержание

1. [Подготовка сервера](#1-подготовка-сервера)
2. [Установка необходимого ПО](#2-установка-необходимого-по)
3. [Настройка пользователя для деплоя](#3-настройка-пользователя-для-деплоя)
4. [Клонирование проекта на сервер](#4-клонирование-проекта-на-сервер)
5. [Настройка переменных окружения](#5-настройка-переменных-окружения)
6. [Настройка GitHub Actions](#6-настройка-github-actions)
7. [Первый деплой](#7-первый-деплой)
8. [Проверка работоспособности](#8-проверка-работоспособности)
9. [Управление приложением](#9-управление-приложением)
10. [Устранение неполадок](#10-устранение-неполадок)
11. [Мониторинг авторов «На карандаше»](#11-мониторинг-авторов-на-карандаше)

---

## 1. Подготовка сервера

### 1.1. Подключение к серверу

```bash
ssh root@ВАШ_IP_АДРЕС
# или
ssh root@ВАШ_ДОМЕН
```

### 1.2. Обновление системы

```bash
# Обновляем список пакетов
apt update

# Обновляем установленные пакеты
apt upgrade -y

# Устанавливаем необходимые утилиты
apt install -y curl wget git nano htop
```

---

## 2. Установка необходимого ПО

### 2.1. Установка Docker

```bash
# Удаляем старые версии (если есть)
apt remove -y docker docker-engine docker.io containerd runc

# Устанавливаем зависимости
apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавляем официальный GPG ключ Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Добавляем репозиторий Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Проверяем установку
docker --version
docker compose version
```

**Ожидаемый результат:**
```
Docker version 24.x.x, build xxxxx
Docker Compose version v2.x.x
```

### 2.2. Настройка Docker (опционально, для оптимизации)

```bash
# Создаем конфигурацию Docker
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Перезапускаем Docker
systemctl restart docker
systemctl enable docker
```

---

## 3. Настройка пользователя для деплоя

### 3.1. Создание пользователя

```bash
# Создаем пользователя deployer
useradd -m -s /bin/bash deployer

# Устанавливаем пароль (запомните его!)
passwd deployer

# Добавляем пользователя в группу docker
usermod -aG docker deployer

# Добавляем пользователя в sudoers (опционально)
usermod -aG sudo deployer
```

### 3.2. Настройка SSH для deployer

```bash
# Переключаемся на пользователя deployer
su - deployer

# Создаем директорию для SSH ключей
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Создаем файл для авторизованных ключей
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3.3. Генерация SSH ключа для GitHub Actions

**На вашем локальном компьютере:**

```bash
# Генерируем SSH ключ (без пароля!)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Это создаст два файла:
# - ~/.ssh/github_actions_deploy (приватный ключ) - для GitHub Secrets
# - ~/.ssh/github_actions_deploy.pub (публичный ключ) - для сервера
```

**Копируем публичный ключ на сервер:**

```bash
# Выводим публичный ключ
cat ~/.ssh/github_actions_deploy.pub

# Скопируйте вывод и выполните на сервере (под пользователем deployer):
echo "ВСТАВЬТЕ_СЮДА_ПУБЛИЧНЫЙ_КЛЮЧ" >> ~/.ssh/authorized_keys
```

**Проверка SSH подключения:**

```bash
# На локальном компьютере проверьте подключение
ssh -i ~/.ssh/github_actions_deploy deployer@ВАШ_IP_АДРЕС

# Если все работает, вы должны подключиться без запроса пароля
```

---

## 4. Клонирование проекта на сервер

### 4.1. Создание директории проекта

**На сервере под пользователем deployer:**

```bash
# Переключаемся на deployer (если еще не переключились)
su - deployer

# Создаем директорию для проекта
sudo mkdir -p /opt/parseVK
sudo chown deployer:deployer /opt/parseVK

# Переходим в директорию
cd /opt/parseVK
```

### 4.2. Клонирование репозитория

**Вариант 1: Публичный репозиторий (через HTTPS)**

```bash
git clone https://github.com/ВАШ_USERNAME/parseVK.git .
```

**Вариант 2: Приватный репозиторий (через SSH)**

Сначала настройте SSH ключ для GitHub:

```bash
# Генерируем SSH ключ для GitHub (если еще нет)
ssh-keygen -t ed25519 -C "deployer@server" -f ~/.ssh/github

# Выводим публичный ключ
cat ~/.ssh/github.pub

# Добавьте этот ключ в GitHub:
# 1. Откройте https://github.com/settings/keys
# 2. Нажмите "New SSH key"
# 3. Вставьте содержимое github.pub
# 4. Сохраните

# Настраиваем SSH config
cat > ~/.ssh/config <<EOF
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github
  StrictHostKeyChecking no
EOF

chmod 600 ~/.ssh/config

# Теперь клонируем
git clone git@github.com:ВАШ_USERNAME/parseVK.git .
```

### 4.3. Проверка клонирования

```bash
# Проверяем, что файлы на месте
ls -la

# Должны увидеть:
# api/
# front/
# docker/
# docker-compose.yml
# .github/
# и другие файлы
```

---

## 5. Настройка переменных окружения

### 5.1. Создание .env файла

```bash
# Копируем шаблон
cd /opt/parseVK
cp .env.production.example .env

# Редактируем файл
nano .env
```

### 5.2. Заполнение .env файла

**Пример заполненного .env:**

```env
# DATABASE
DATABASE_URL=postgresql://postgres:MySecurePassword123!@db:5432/vk_api?schema=public

# VK API TOKEN
# Получить токен: https://vkhost.github.io/
VK_TOKEN=vk1.a.ВАSШ_РЕАЛЬНЫЙ_ТОКЕН_ОТ_ВК

# FRONTEND
VITE_APP_TITLE=ВК Аналитик
VITE_API_URL=/api
VITE_DEV_MODE=false

# POSTGRES
POSTGRES_USER=postgres
POSTGRES_PASSWORD=MySecurePassword123!
POSTGRES_DB=vk_api

# API
PORT=3000

# REDIS (опционально)
REDIS_URL=redis://redis:6379
```

**ВАЖНО:**
- Замените `MySecurePassword123!` на **сильный** пароль
- Замените `ВАSШ_РЕАЛЬНЫЙ_ТОКЕН_ОТ_ВК` на реальный токен VK
- Сохраните изменения: `Ctrl+O`, затем `Enter`, затем `Ctrl+X`

### 5.3. Защита .env файла

```bash
# Устанавливаем права доступа (только владелец может читать)
chmod 600 .env

# Проверяем
ls -la .env
# Должно быть: -rw------- 1 deployer deployer
```

---

## 6. Настройка GitHub Actions

### 6.1. Добавление Secrets в GitHub

1. Откройте ваш репозиторий на GitHub
2. Перейдите в `Settings` → `Secrets and variables` → `Actions`
3. Нажмите `New repository secret`

**Добавьте следующие секреты:**

| Имя секрета | Значение | Описание |
|------------|----------|----------|
| `SERVER_HOST` | `192.168.1.100` | IP адрес вашего сервера |
| `SERVER_USER` | `deployer` | Имя пользователя на сервере |
| `SERVER_PORT` | `22` | SSH порт (обычно 22) |
| `SSH_PRIVATE_KEY` | Содержимое `~/.ssh/github_actions_deploy` | Приватный SSH ключ |
| `PROJECT_PATH` | `/opt/parseVK` | Путь к проекту на сервере |

**Как добавить SSH_PRIVATE_KEY:**

```bash
# На локальном компьютере выведите приватный ключ
cat ~/.ssh/github_actions_deploy

# Скопируйте ВСЁ содержимое (включая строки BEGIN и END)
# Вставьте в поле Value в GitHub
```

### 6.2. Проверка workflow файла

Убедитесь, что файл `.github/workflows/deploy.yml` присутствует в репозитории:

```bash
# На локальном компьютере
cd ~/Project/parseVK
cat .github/workflows/deploy.yml
```

Если файла нет - он уже создан в предыдущих шагах.

---

## 7. Первый деплой

### 7.1. Ручной первый запуск (рекомендуется)

**На сервере:**

```bash
# Переходим в директорию проекта
cd /opt/parseVK

# Проверяем, что все файлы на месте
ls -la

# Проверяем наличие .env
cat .env

# Запускаем сборку и запуск контейнеров
docker compose up -d --build

# Ждем завершения (~5-10 минут при первом запуске)
# Следим за процессом:
docker compose logs -f
```

**Что вы увидите:**
1. Скачивание образов (postgres, redis, node, nginx)
2. Сборка backend (установка зависимостей, генерация Prisma, сборка)
3. Сборка frontend (установка зависимостей, сборка Vite)
4. Запуск миграций БД
5. Запуск всех сервисов

**Проверка запуска:**

```bash
# Проверяем статус контейнеров
docker compose ps

# Должны увидеть 4 запущенных контейнера:
# - postgres_db (Up, healthy)
# - redis (Up)
# - api (Up)
# - frontend (Up)
```

**Безопасность доступа к БД:**

Открытый наружу порт `5432` предназначен только для административного подключения. Ограничьте к нему доступ с помощью файрвола (например, `ufw allow from <ваш_IP> to any port 5432`) или настройте VPN/SSH-туннель, чтобы исключить посторонние подключения.

### 7.2. Автоматический деплой через GitHub Actions

**После успешного ручного запуска:**

1. **Закоммитьте все изменения в main:**

```bash
# На локальном компьютере
cd ~/Project/parseVK

git add .
git commit -m "Настройка CI/CD деплоя"
git push origin main
```

2. **Проверьте запуск workflow:**
   - Откройте ваш репозиторий на GitHub
   - Перейдите во вкладку `Actions`
   - Вы должны увидеть запущенный workflow "Deploy to Production Server"
   - Нажмите на него, чтобы увидеть логи

3. **Следите за выполнением:**
   - Шаг 1: Checkout code ✓
   - Шаг 2: Check server connectivity ✓
   - Шаг 3: Deploy to server via SSH ✓
   - Шаг 4: Deployment status ✓

### 7.3. Ручной деплой через скрипт

**Альтернативный способ (с локального компьютера):**

```bash
# На локальном компьютере
cd ~/Project/parseVK

# Запускаем скрипт деплоя
./deploy.sh deployer@ВАШ_IP_АДРЕС /opt/parseVK

# Скрипт автоматически:
# 1. Подключится к серверу
# 2. Обновит код из Git
# 3. Пересоберет и запустит контейнеры
# 4. Покажет статус
```

---

## 8. Проверка работоспособности

### 8.1. Проверка через браузер

Откройте браузер и перейдите по адресу:

```
http://ВАШ_IP_АДРЕС
```

Вы должны увидеть интерфейс приложения **ВК Аналитик**.

### 8.2. Проверка API

```bash
# На сервере или локальном компьютере
curl http://ВАШ_IP_АДРЕС/api/health

# Ожидаемый ответ (если есть health endpoint):
# {"status":"ok"}

# Или проверьте любой API endpoint:
curl http://ВАШ_IP_АДРЕС/api/tasks
```

### 8.3. Проверка логов

**На сервере:**

```bash
cd /opt/parseVK

# Просмотр логов всех сервисов
docker compose logs

# Логи API
docker compose logs api

# Логи Frontend
docker compose logs frontend

# Логи БД
docker compose logs db

# Логи в реальном времени
docker compose logs -f --tail=100
```

### 8.4. Проверка базы данных

```bash
# Подключаемся к контейнеру postgres
docker exec -it postgres_db psql -U postgres -d vk_api

# В psql выполняем:
\dt  # Список таблиц
\q   # Выход
```

---

## 9. Управление приложением

### 9.1. Основные команды

**Остановка приложения:**
```bash
cd /opt/parseVK
docker compose down
```

**Запуск приложения:**
```bash
cd /opt/parseVK
docker compose up -d
```

**Перезапуск:**
```bash
cd /opt/parseVK
docker compose restart
```

**Пересборка с нуля:**
```bash
cd /opt/parseVK
docker compose down
docker compose up -d --build --force-recreate
```

### 9.2. Обновление кода

**Автоматически:**
- Просто сделайте `git push` в main ветку
- GitHub Actions автоматически задеплоит изменения

**Вручную:**
```bash
cd /opt/parseVK
git pull origin main
docker compose up -d --build
```

### 9.3. Просмотр статуса

```bash
# Статус контейнеров
docker compose ps

# Использование ресурсов
docker stats

# Логи
docker compose logs -f --tail=50
```

### 9.4. Резервное копирование БД

Контейнер `db_backup` автоматически сохраняет дамп PostgreSQL каждый день в 03:00 и хранит копии за последние 7 дней. Файлы попадают в volume `parsevk_postgres_backups` в формате `vk_api_ГГГГММДД_ЧЧММСС.sql.gz`.

**Параметры по умолчанию** можно изменить через переменные окружения в `docker-compose.yml`:
- `BACKUP_SCHEDULE` — расписание cron (например, `"0 */6 * * *"` для бэкапа каждые 6 часов).
- `BACKUP_KEEP_DAYS` — сколько дней хранить файлы.
- `BACKUP_DIR` — путь внутри контейнера (оставьте `/backups`, чтобы не менять volume).

**Ручное создание бэкапа:**

```bash
docker compose run --rm db_backup /usr/local/bin/backup.sh
```

**Восстановление из бэкапа:**

```bash
# выбираем нужный файл
docker run --rm -v parsevk_postgres_backups:/backups alpine ls /backups

# восстанавливаем
gunzip -c /path/to/vk_api_20240101_030000.sql.gz | docker exec -i postgres_db sh -c "PGPASSWORD=postgres psql -U postgres vk_api"
```

### 9.5. Очистка Docker

```bash
# Удаление неиспользуемых образов
docker image prune -a

# Удаление неиспользуемых volumes
docker volume prune

# Полная очистка (ОСТОРОЖНО! Удалит все остановленные контейнеры)
docker system prune -a --volumes
```

---

## 10. Устранение неполадок

### 10.1. Контейнеры не запускаются

**Проблема:** `docker compose ps` показывает Exit или Restarting

**Решение:**

```bash
# Смотрим логи проблемного контейнера
docker compose logs api
# или
docker compose logs frontend

# Проверяем .env файл
cat .env

# Пересоздаем контейнеры
docker compose down
docker compose up -d --force-recreate
```

### 10.2. Ошибка подключения к БД

**Проблема:** API не может подключиться к PostgreSQL

**Решение:**

```bash
# Проверяем здоровье БД
docker compose ps db

# Должно быть: healthy

# Если нет, смотрим логи
docker compose logs db

# Проверяем DATABASE_URL в .env
grep DATABASE_URL .env

# Перезапускаем БД
docker compose restart db
```

### 10.3. Frontend показывает ошибку подключения к API

**Проблема:** В браузере ошибка "Failed to fetch" или "Network Error"

**Решение:**

```bash
# Проверяем работу nginx
docker compose logs frontend

# Проверяем работу API
curl http://localhost:3000/api/tasks

# Проверяем nginx конфигурацию
docker exec frontend cat /etc/nginx/conf.d/default.conf

# Перезапускаем frontend
docker compose restart frontend
```

### 10.4. GitHub Actions деплой не работает

**Проблема:** Workflow завершается с ошибкой

**Решение:**

1. **Проверьте Secrets в GitHub:**
   - Все ли секреты добавлены?
   - Правильные ли значения?

2. **Проверьте SSH подключение вручную:**
```bash
ssh -i ~/.ssh/github_actions_deploy deployer@ВАШ_IP
```

3. **Проверьте права deployer на сервере:**
```bash
# На сервере
groups deployer
# Должно включать: docker

# Если нет:
sudo usermod -aG docker deployer
```

4. **Проверьте путь к проекту:**
```bash
ls -la /opt/parseVK
```

### 10.5. Порт 80 уже занят

**Проблема:** `Error: Bind for 0.0.0.0:80 failed: port is already allocated`

**Решение:**

```bash
# Найдите процесс, занимающий порт 80
sudo lsof -i :80

# Или
sudo netstat -tulpn | grep :80

# Остановите процесс (например, apache2 или nginx)
sudo systemctl stop apache2
# или
sudo systemctl stop nginx

# Отключите автозапуск
sudo systemctl disable apache2

# Или измените порт в docker-compose.yml:
# frontend:
#   ports:
#     - "8080:80"  # Вместо 80:80
```

### 10.6. Логи показывают "Permission denied"

**Проблема:** Ошибки прав доступа

**Решение:**

```bash
# Проверяем владельца директории проекта
ls -la /opt/parseVK

# Должно быть: deployer:deployer

# Если нет, исправляем:
sudo chown -R deployer:deployer /opt/parseVK

# Проверяем права на .env
ls -la /opt/parseVK/.env
# Должно быть: -rw------- deployer deployer
```

### 10.7. Нехватка памяти

**Проблема:** Контейнеры крашатся или не запускаются из-за памяти

**Решение:**

```bash
# Проверяем использование памяти
free -h

# Добавляем swap (если его нет)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Делаем постоянным
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Или ограничьте память в docker-compose.yml:
# services:
#   api:
#     mem_limit: 512m
```

---

## Дополнительные рекомендации

### Безопасность

1. **Firewall (UFW):**
```bash
# Установка
sudo apt install ufw

# Разрешаем SSH
sudo ufw allow 22/tcp

# Разрешаем HTTP
sudo ufw allow 80/tcp

# Если нужен HTTPS
sudo ufw allow 443/tcp

# Включаем firewall
sudo ufw enable

# Проверяем статус
sudo ufw status
```

2. **Регулярные обновления:**
```bash
# Создаем скрипт обновления
sudo nano /usr/local/bin/update-system.sh

# Содержимое:
#!/bin/bash
apt update && apt upgrade -y
docker image prune -af

# Делаем исполняемым
sudo chmod +x /usr/local/bin/update-system.sh

# Добавляем в cron (каждое воскресенье в 3:00)
sudo crontab -e
# Добавить строку:
0 3 * * 0 /usr/local/bin/update-system.sh
```

3. **Изменение SSH порта (опционально):**
```bash
sudo nano /etc/ssh/sshd_config
# Измените: Port 22 на Port 2222
sudo systemctl restart sshd

# Не забудьте обновить GitHub Secrets!
```

### Мониторинг

```bash
# Создаем скрипт мониторинга
nano ~/monitor.sh

# Содержимое:
#!/bin/bash
echo "=== Container Status ==="
docker compose -f /opt/parseVK/docker-compose.yml ps
echo ""
echo "=== Resource Usage ==="
docker stats --no-stream
echo ""
echo "=== Disk Usage ==="
df -h

# Делаем исполняемым
chmod +x ~/monitor.sh

# Запускаем
./monitor.sh
```

---

## Итоговая структура

После завершения настройки у вас будет:

```
Локальный компьютер:
├── ~/.ssh/github_actions_deploy     # Приватный ключ для GitHub
├── ~/.ssh/github_actions_deploy.pub # Публичный ключ
└── ~/Project/parseVK/
    ├── .github/workflows/deploy.yml # GitHub Actions
    ├── deploy.sh                     # Скрипт ручного деплоя
    └── .env.production.example       # Шаблон .env

Сервер:
├── /opt/parseVK/                     # Проект
│   ├── api/
│   ├── front/
│   ├── docker/
│   ├── .env                          # Переменные окружения (не в git!)
│   └── docker-compose.yml
└── /home/deployer/.ssh/
    └── authorized_keys                # Публичный ключ для GitHub Actions
```

---

## Поддержка

Если что-то не работает:

1. Проверьте логи: `docker compose logs -f`
2. Проверьте статус: `docker compose ps`
3. Проверьте GitHub Actions: вкладка Actions в репозитории
4. Проверьте, что все секреты правильно добавлены в GitHub

**Полезные команды для отладки:**

```bash
# На сервере
docker compose ps          # Статус контейнеров
docker compose logs -f     # Логи в реальном времени
docker stats               # Использование ресурсов
curl http://localhost:80   # Проверка frontend
curl http://localhost:3000/api/tasks  # Проверка API

# Проверка сети Docker
docker network inspect parseVK_default

# Подключение к контейнеру
docker exec -it api sh
docker exec -it postgres_db psql -U postgres -d vk_api
```

## 11. Мониторинг авторов «На карандаше»

Фоновая служба приложения отслеживает авторов, добавленных через фронтенд в раздел «На карандаше». Параметры мониторинга хранятся в таблице `WatchlistSettings` (глобальная запись с `id=1`):

- `trackAllComments` — включает сбор всех комментариев автора, даже если посты не были загружены задачами.
- `pollIntervalMinutes` — минимальный интервал между циклами обновления.
- `maxAuthors` — ограничивает число авторов, обрабатываемых за один цикл мониторинга.

REST API (`/watchlist/authors`, `/watchlist/settings`) и фронтенд позволяют просматривать статистику по авторам, найденные комментарии и переключать параметры мониторинга. При добавлении автора из карточки комментария исходный комментарий автоматически помечается как найденный мониторингом.

---

**Готово! Ваше приложение теперь автоматически деплоится при каждом push в main ветку.**

При возникновении вопросов - обращайтесь к разделу "Устранение неполадок" выше.

# ParseVK — VK Service

Микросервис для интеграции с API ВКонтакте (VK) и Одноклассники (OK), импорта данных и экспорта списков друзей в формат XLSX.

## Архитектура (Layered Architecture)

Сервис переведен со структуры Three-Tier модулей на классическую **слоистую архитектуру** (Layered Architecture) для обеспечения строгого разделения обязанностей и соответствия Dependency Rule (`api / tasks -> services -> domain <- infrastructure`):

- **Presentation Layer (`app/api/`)**:
  - `routers/` — роутеры FastAPI для экспорта друзей VK/OK и методов работы с VK API.
  - `schemas/` — Pydantic-схемы (DTO) для валидации входящих и исходящих данных эндпоинтов.
  - `dependencies.py` — инфраструктурные зависимости для роутеров FastAPI.
- **Business Logic Layer (`app/services/`)**:
  - `vk_friends_service.py`, `ok_friends_service.py` — сервисы управления жизненным циклом задач экспорта.
  - `ingestion_service.py`, `vk_groups_service.py` — сервисы сбора, сохранения и удаления групп ВКонтакте.
  - `domain_events_service.py` — сервис публикации доменных событий (outbox pattern).
  - `task_events_service.py` — сервис обработки входящих событий жизненного цикла задач.
  - `workbook.py` — генерация отчетов XLSX.
- **Domain Layer (`app/domain/`)**:
  - `models/` — чистые доменные сущности (задачи экспорта, события outbox, группы).
  - `repositories/` — абстрактные интерфейсы репозиториев (определяют контракты хранения данных).
- **Infrastructure Layer (`app/infrastructure/`)**:
  - `db/repositories/` — конкретные реализации репозиториев с использованием SQLAlchemy 2.0.
  - `db/session.py` — конфигурация подключения к БД и сессий SQLAlchemy.
  - `vk_client/`, `ok_client/`, `tasks_client/` — низкоуровневые HTTP-адаптеры к внешним API.
- **Background Tasks (`app/tasks/`)**:
  - `kafka_consumer.py` — асинхронный консьюмер событий задач из Kafka.
  - `outbox_worker.py` — воркер для надежной публикации событий из таблицы outbox в Kafka.
- **Composition Root (`app/bootstrap.py`)**:
  - Точка сборки приложения, где происходит ручное связывание абстрактных интерфейсов домена с их инфраструктурными реализациями (Dependency Injection).

## Запуск тестов

Тесты запускаются локально в виртуальном окружении с помощью `pytest` из директории сервиса:

```bash
cd services/vk-service
uv run pytest tests/ -v
```

---
name: parsevk-service-architecture
description: Enforces, validates, and scaffolds parseVK FastAPI microservices according to the repository's three-tier architecture standard (Router → Service → Repository). Use when creating new services, auditing existing ones for compliance, or refactoring services that violate the standard (e.g., business logic in routers or repositories). Do not use for general code reviews or deployment tasks.
---

# parseVK Service Architecture Skill

## Purpose
Обеспечивает единообразие архитектуры всех FastAPI-микросервисов в parseVK. Навык содержит стандарты, скрипты валидации, шаблоны и чеклисты для создания новых сервисов и приведения существующих к общему знаменателю.

## When to use
- Создание нового FastAPI-микросервиса в `services/`
- Аудит существующего сервиса на соответствие архитектурному стандарту
- Рефакторинг сервиса с нарушениями (логика в роутерах, бизнес-логика в репозиториях)
- Код-ревью архитектурных изменений в микросервисах

## When not to use
- Общее код-ревью без архитектурного контекста
- Работа с легаси NestJS-монолитом в `api/`
- Багфиксы, не затрагивающие архитектуру сервиса

## Inputs
- Имя сервиса (для создания нового)
- Путь к существующему сервису (для валидации/рефакторинга)

## Procedure

### 1. Создание нового сервиса

```powershell
cd tools/parsevkctl-go
go run ./cmd/parsevkctl task create "feat({name}): create {name} FastAPI service"
go run ./cmd/parsevkctl task start ISSUE_NUMBER
```

Затем запусти скрипт скаффолдинга:

```powershell
python .agents/skills/parsevk-service-architecture/scripts/scaffold-service.py {service-name}
```

Это создаст структуру сервиса в `services/{service-name}/`.

### 2. Валидация существующего сервиса

```powershell
python .agents/skills/parsevk-service-architecture/scripts/validate-service.py services/{service-name}
```

Скрипт проверит:
- Структуру директорий
- Наличие обязательных файлов
- Паттерны импортов
- Разделение Router → Service → Repository
- Конфигурацию через pydantic-settings

### 3. Рефакторинг сервиса

Если скрипт валидации выявил нарушения, следуй правилам из
[чеклиста](references/CHECKLIST.md) и [архитектурного стандарта](references/ARCHITECTURE.md).

Типовые нарушения и их исправление:

| Нарушение | Пример | Исправление |
|-----------|--------|-------------|
| Бизнес-логика в роутере | vk-service: `save_group()` в router.py | Вынести в `service.py` |
| Бизнес-логика в репозитории | content-service: `verify_author()` в repository.py | Создать `service.py`, переместить логику |
| Нет Service Layer | content-service: router → repository | Создать `service.py` между ними |
| Raw `os.environ` | Прямой вызов `os.getenv()` | Заменить на `pydantic-settings` |

## Output format
- Для нового сервиса: сгенерированная структура файлов
- Для валидации: отчёт с пройденными/проваленными проверками
- Для рефакторинга: список изменённых файлов с описанием

## Safety rules
- Не изменяй существующую бизнес-логику без необходимости
- Не удаляй рабочие эндпоинты
- Сохраняй обратную совместимость API-контрактов
- После рефакторинга запусти тесты сервиса

## Validation expectations
- `validate-service.py` не должен выдавать ошибок
- Все эндпоинты проходят существующие тесты
- Сохранены все публичные контракты API

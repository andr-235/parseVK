## Service Migration: [Имя сервиса] to FastAPI rewrite

## Goal
Перенести существующий сервис `[Legacy-имя]` на новый архитектурный стек FastAPI с сохранением API-контрактов.

## Background
- Текущие проблемы: [Архитектурный долг, производительность]
- Целевой стек: FastAPI, Pydantic v2, Python 3.11+

## Scope
- Create new service folder: `services/[Имя сервиса]`
- Implement app structure: config, main, schemas, endpoints
- Migrate legacy logic
- Implement unit tests

## Out of Scope
- Добавление новой бизнес-логики, не связанной с текущей работой сервиса.
- Изменение схем базы данных (если не согласовано отдельно).

## Acceptance Criteria
- [ ] Структура папок соответствует стандарту FastAPI репозитория.
- [ ] Все существующие роуты покрыты тестами и возвращают корректные контракты.
- [ ] Docker-конфиг собран и запускается без ошибок.
- [ ] Линтеры (Ruff) и статический анализ (Mypy) проходят без предупреждений.

## Validation
```bash
pytest services/[Имя сервиса]/tests
ruff check services/[Имя сервиса]
mypy services/[Имя сервиса]
```

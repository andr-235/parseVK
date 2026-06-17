## Goal

[Краткое описание бизнес-цели и проблемы, которую решает задача]

## Background

[Контекст, ссылки на связанные сервисы, архитектурные решения]

## Scope

[Список изменяемых файлов или модулей. Будьте точечными.]
- Create or update: `path/to/file`

## Out of Scope

[Что трогать категорически запрещено]
- Do not modify: `path/to/other/service`
- Do not add dependencies unless explicitly requested.

## Acceptance Criteria

- [ ] [Критерий 1]
- [ ] [Критерий 2]

## Validation

[Команды локальной проверки]
```bash
pytest services/my-service/tests
ruff check services/my-service
```

## Risk

[Low/Medium/High] - [Обоснование риска]

## AI Session Budget

Expected sessions: [1/2]

## Required Handoff

При завершении задачи предоставить:
- Сводку (summary)
- Измененные файлы
- Результаты запуска проверочных команд
- Риски и допущения
- Следующую рекомендуемую задачу

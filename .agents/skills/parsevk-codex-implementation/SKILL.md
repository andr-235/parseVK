---
name: parsevk-codex-implementation
description: Use when implementing a scoped parseVK GitHub Issue with Codex. Guides the execution, code modification, local testing, and validation of code changes. Do not use for issue planning, PR review, or merge gates.
---

# parseVK Codex Implementation Skill

## Purpose
Навык управляет процессом безопасной и точечной реализации задачи в коде согласно описанию GitHub Issue.

## When to use
- Во время написания кода для решения конкретного Issue.
- При создании новых сервисов, компонентов или багфиксе.
- При локальном запуске проверочных тестов во время разработки.

## When not to use
- При составлении или планировании задач.
- При проверке пулл-реквестов в чате (ревью).
- При подготовке к слиянию ветки в `main`.

## Inputs
- GitHub Issue (номер, название, описание, критерии приемки).
- Текущая task-ветка в Git.

## Procedure
1. **Чтение и разбор задачи**: Перед написанием кода внимательно прочитайте Goal, Scope и Out of Scope в Issue.
2. **Локализация изменений**: Убедитесь, что вы находитесь в ветке задачи, а не в `main`. Не трогайте файлы за пределами Scope задачи.
3. **Хирургическая правка кода**:
   - Пишите минимальный, точечный код, решающий задачу.
   - Избегайте побочных рефакторингов (например, форматирования несвязанных файлов, переписывания других методов).
   - Для сложных правок сперва составьте `task.md`.
4. **Запуск проверок**:
   - Найдите подходящие тесты и линтеры с помощью `references/validation-matrix.md`.
   - Запустите тесты локально.
   - **Строгое правило**: Никогда не пишите в отчетах, что тесты пройдены, если вы их физически не запускали.
5. **Анализ измененных файлов**: Запустите read-only скрипт `scripts/changed-files.sh` для проверки списка измененных файлов. Если там есть файлы вне Scope, откатите их точечно.
6. **Коммит изменений**: Сделайте коммит согласно commit rules из `AGENTS.md` (Conventional Commits, imperative mood, Refs: #ISSUE, Closes #ISSUE).

## Output format
Краткое описание выполненных изменений в чате и результаты тестов.

## Safety rules
- Все скрипты проверки и анализа в папке `scripts/` должны быть строго read-only. Запрещено выполнять запись файлов, `git checkout`, `git pull`, `git push`, `gh pr` из скриптов.
- Не коммитьте `.env`, `.env.local`, приватные ключи и API-токены.

## Validation expectations
- Тесты проходят успешно (pass).
- Вывод `scripts/changed-files.sh` содержит только файлы из Scope задачи.

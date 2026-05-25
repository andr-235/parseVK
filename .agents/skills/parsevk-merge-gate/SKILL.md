---
name: parsevk-merge-gate
description: Use when validating if a parseVK Pull Request is ready to merge. Evaluates open state, branch matching, CI checks, secret scans, and review status. Do not use for code implementation or planning.
---

# parseVK Merge Gate Skill

## Purpose
Навык описывает жесткие критерии и проверки перед слиянием (merge) Pull Request в целевую ветку `main`.

## When to use
- Перед запуском команды `parsevkctl task merge ISSUE_NUMBER`.
- При вынесении окончательного решения о готовности фичи к релизу.

## When not to use
- Во время написания кода или локального тестирования.
- Для рецензирования (Code Review) в чате.

## Inputs
- Ссылка на Pull Request или номер PR.
- Ссылка на связанное Issue.

## Procedure
1. **Проверка состояния PR**: Запустите read-only скрипт `scripts/merge-gate.sh`. PR должен быть открыт (`state: OPEN`) и не находиться в состоянии черновика (`isDraft: false`).
2. **Проверка целевой ветки**: Базовая ветка должна быть корректной (обычно `main`).
3. **Проверка связи с Issue**: Описание PR обязано содержать конструкцию `Closes #ISSUE_NUMBER` или `Fixes #ISSUE_NUMBER`.
4. **Проверка статуса CI/CD**: Убедитесь, что все автоматические проверки (GitHub Actions) прошли успешно.
5. **Проверка безопасности**: Запустите скрипт проверки секретов `scripts/secret-scan.sh`. Обнаружение секретов — абсолютный блокиратор слияния.
6. **Проверка рецензий (Code Review)**:
   - Все блокирующие замечания (Blockers) из Code Review должны быть устранены.
   - **Обратите внимание**: Аппрув на GitHub от того же пользователя, который создал PR, не требуется для слияния.
7. **Формирование отчета**: Заполните отчет по шаблону `assets/merge-report-template.md`.

## Output format
Отчет о готовности к слиянию по шаблону `assets/merge-report-template.md`.

## Safety rules
- Скрипт `scripts/merge-gate.sh` должен быть строго read-only.
- Навык запрещено вызывать неявно. Только явный вызов `$parsevk-merge-gate` или через `/skills`.

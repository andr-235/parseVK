---
name: parsevk-handoff
description: Use when producing the required AI handoff at the end of a parseVK implementation or PR review. Generates standardized context handoffs with summaries, files, validations, risks, and next steps. Do not use for planning or merge decisions.
---

# parseVK Handoff Skill

## Purpose
Навык предназначен для стандартизации передачи контекста (Handoff) при окончании работы над задачей или завершении Code Review.

## When to use
- В самом конце ИИ-сессии после слияния Pull Request или создания PR.
- После подготовки детального Code Review отчета.

## When not to use
- При планировании задач.
- Во время написания кода или тестирования.

## Inputs
- Ссылка на Pull Request или Issue.
- Список измененных файлов.
- Список запущенных команд проверки и их лог-выводы.

## Procedure
1. **Сбор фактов**:
   - Сформируйте точный список измененных файлов.
   - Соберите список запущенных команд (например, `pytest`, `go test ./...`) и их статусы.
2. **Анализ оставшихся рисков**: Укажите все допущения, архитектурные долги или инфраструктурные риски, возникшие при реализации.
3. **Определение пропущенных шагов**: Явно опишите, что не было сделано (Out of Scope или отложено).
4. **Рекомендация следующей задачи**: Предложите следующее логичное Issue для разработки (например, миграция связанного сервиса или написание интеграционных тестов).
5. **Генерация отчета**: Оформите финальный ответ в чате по одному из шаблонов:
   - `assets/implementation-handoff-template.md` (для задач реализации)
   - `assets/review-handoff-template.md` (для задач рецензирования)

## Output format
Финальное резюме в чате согласно шаблонам handoff.

## Safety rules
- Не включайте конфиденциальные переменные, токены и приватные адреса серверов в отчет handoff.

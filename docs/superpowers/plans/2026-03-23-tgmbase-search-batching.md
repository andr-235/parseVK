# Tgmbase Search Batching Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Снять клиентское ограничение на 200 запросов в tgmbase search и обрабатывать большие массивы внутренними чанками по 200 с единым итоговым отчётом.

**Architecture:** Валидация DTO больше не режет массив `queries` по верхней границе. Сервис поиска принимает любой размер входного массива, делит его на последовательные чанки по 200 запросов, для каждого чанка запускает текущую логику поиска и затем склеивает результаты в единый `items` и пересчитанный `summary`.

**Tech Stack:** NestJS, TypeScript, class-validator, Vitest.

---

## Chunk 1: Зафиксировать поведение тестами

### Task 1: Добавить падающие тесты на DTO и сервис

**Files:**
- Modify: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`
- Create: `api/src/tgmbase-search/dto/tgmbase-search-request.dto.spec.ts`
- Test: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`
- Test: `api/src/tgmbase-search/dto/tgmbase-search-request.dto.spec.ts`

- [ ] **Step 1: Написать тест, что DTO принимает 201 запрос**
- [ ] **Step 2: Запустить тест и увидеть fail из-за `ArrayMaxSize(200)`**
- [ ] **Step 3: Написать тест, что сервис обрабатывает 201 запрос и возвращает 201 элемент**
- [ ] **Step 4: Запустить тест и увидеть fail на текущей реализации**

## Chunk 2: Реализовать батчинг

### Task 2: Убрать внешний лимит и добавить внутренние чанки

**Files:**
- Modify: `api/src/tgmbase-search/dto/tgmbase-search-request.dto.ts`
- Modify: `api/src/tgmbase-search/tgmbase-search.service.ts`
- Test: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`
- Test: `api/src/tgmbase-search/dto/tgmbase-search-request.dto.spec.ts`

- [ ] **Step 1: Удалить `ArrayMaxSize(200)` из DTO**
- [ ] **Step 2: Вынести размер чанка в константу сервиса**
- [ ] **Step 3: Разбивать `payload.queries` на чанки по 200 и обрабатывать последовательно**
- [ ] **Step 4: Склеивать результаты чанков и строить единый `summary`**

## Chunk 3: Проверить итог

### Task 3: Прогнать релевантные тесты

**Files:**
- Test: `api/src/tgmbase-search/dto/tgmbase-search-request.dto.spec.ts`
- Test: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`

- [ ] **Step 1: Запустить только tgmbase search unit tests**
- [ ] **Step 2: Убедиться, что оба сценария проходят**

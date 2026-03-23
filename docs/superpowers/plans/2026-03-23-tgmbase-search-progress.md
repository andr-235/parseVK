# Tgmbase Search Progress Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить live-прогресс поиска по tgmbase через WebSocket и показать его на странице поиска.

**Architecture:** Фронтенд генерирует `searchId`, подписывается на отдельный websocket namespace `tgmbase-search` и отправляет этот `searchId` в обычный HTTP-запрос поиска. Бэкенд публикует события `started`, `progress`, `completed`, `failed` в room по `searchId`, а фронтенд обновляет progress UI независимо от итогового HTTP-ответа.

**Tech Stack:** NestJS, socket.io, React, TypeScript, React Query, Vitest.

---

## Chunk 1: Зафиксировать backend-прогресс тестами

### Task 1: WebSocket progress events for tgmbase search

**Files:**
- Modify: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`
- Create: `api/src/tgmbase-search/tgmbase-search.gateway.ts`
- Modify: `api/src/tgmbase-search/dto/tgmbase-search-request.dto.ts`
- Modify: `api/src/tgmbase-search/tgmbase-search.service.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `bun test src/tgmbase-search/tgmbase-search.service.spec.ts` and verify it fails**
- [ ] **Step 3: Add minimal gateway, `searchId` support, and event publishing**
- [ ] **Step 4: Run `bun test src/tgmbase-search/tgmbase-search.service.spec.ts` and verify it passes**

## Chunk 2: Зафиксировать frontend progress UX тестами

### Task 2: Frontend progress state and page rendering

**Files:**
- Modify: `front/src/modules/tgmbase-search/hooks/useTgmbaseSearchState.ts`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx`
- Modify: `front/src/modules/tgmbase-search/api/tgmbaseSearch.api.ts`
- Create: `front/src/modules/tgmbase-search/hooks/useTgmbaseSearchState.test.ts`

- [ ] **Step 1: Write failing tests for socket-driven progress state and `searchId` propagation**
- [ ] **Step 2: Run targeted frontend tests and verify they fail**
- [ ] **Step 3: Implement minimal socket progress state and page UI**
- [ ] **Step 4: Run targeted frontend tests and verify they pass**

## Chunk 3: Финальная проверка

### Task 3: Verify backend and frontend together

**Files:**
- Test: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`
- Test: `front/src/modules/tgmbase-search/hooks/useTgmbaseSearchState.test.ts`

- [ ] **Step 1: Run relevant backend and frontend test commands**
- [ ] **Step 2: Confirm progress payloads and UI states are green**

# Tgmbase Search Logging Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить наблюдаемое backend-логирование для поиска `tgmbase`, чтобы в контейнерных логах были видны старт поиска, подписка сокета, выполнение батчей и завершение.

**Architecture:** Логирование остаётся локальным в `TgmbaseSearchService` и `TgmbaseSearchGateway`, без изменения протокола API и websocket-событий. Сервис пишет агрегированные этапы выполнения, а gateway логирует подписку и отправку прогресса по `searchId`.

**Tech Stack:** NestJS, Logger, Vitest, TypeScript

---

## Chunk 1: Backend logging

### Task 1: Зафиксировать ожидаемое поведение тестами

**Files:**
- Modify: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Добавить проверки, что сервис пишет лог старта, лог завершения батча и лог завершения поиска, а gateway логирует подписку и отправку прогресса.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && bun test src/tgmbase-search/tgmbase-search.service.spec.ts`
Expected: FAIL из-за отсутствующих вызовов logger.

- [ ] **Step 3: Write minimal implementation**

Добавить точечные `logger.log`, `logger.warn`, `logger.debug` и `logger.error` в `TgmbaseSearchService` и `TgmbaseSearchGateway`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && bun test src/tgmbase-search/tgmbase-search.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Run focused verification**

Run: `cd api && bun run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/tgmbase-search/tgmbase-search.service.ts api/src/tgmbase-search/tgmbase-search.gateway.ts api/src/tgmbase-search/tgmbase-search.service.spec.ts docs/superpowers/plans/2026-03-23-tgmbase-search-logging.md
git commit -m "fix: добавить логирование поиска tgmbase"
```

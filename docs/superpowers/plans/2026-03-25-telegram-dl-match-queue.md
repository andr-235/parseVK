# Telegram DL Match Queue Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести DL-match на фоновую `BullMQ`-очередь, чтобы `POST /api/telegram/dl-match/runs` отвечал сразу, а матчинг выполнялся батчами с progress-логами и polling по статусу.

**Architecture:** `TelegramDlMatchService` делится на быстрый `createRun()` и тяжёлый `processRun(runId)`. Новый producer/processor в `telegram-dl-match/queues` ставит run в очередь и выполняет его в фоне с `concurrency = 1`, а фронт поллит `GET /runs/:id` до `DONE` или `FAILED`.

**Tech Stack:** NestJS, BullMQ, Prisma tgmbase client, React 19, TanStack Query, Vitest, Testing Library.

---

## Chunk 1: Backend queue and background processing

### Task 1: Add BullMQ queue for DL match jobs

**Files:**
- Create: `api/src/telegram-dl-match/queues/telegram-dl-match.constants.ts`
- Create: `api/src/telegram-dl-match/queues/telegram-dl-match.queue.ts`
- Create: `api/src/telegram-dl-match/queues/telegram-dl-match.processor.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.module.ts`
- Test: `api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts`

- [ ] **Step 1: Write the failing queue/controller test**

```ts
it('creates run and returns RUNNING without executing full match inline', async () => {
  await expect(controller.createRun()).resolves.toMatchObject({
    status: 'RUNNING',
  })
  expect(queue.enqueue).toHaveBeenCalledWith(expect.objectContaining({ runId: '1' }))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
Expected: FAIL because queue producer and async create path are absent.

- [ ] **Step 3: Add queue constants and producer**

```ts
export const TELEGRAM_DL_MATCH_QUEUE = 'telegram-dl-match'
export const TELEGRAM_DL_MATCH_JOB = 'process-run'
```

- [ ] **Step 4: Register queue in module**

Run: wire `BullModule.registerQueue({ name: TELEGRAM_DL_MATCH_QUEUE })` into `telegram-dl-match.module.ts` and provide producer/processor.
Expected: module compiles with queue dependencies.

- [ ] **Step 5: Run targeted tests**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/src/telegram-dl-match/queues api/src/telegram-dl-match/telegram-dl-match.module.ts api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts
git commit -m "feat: добавить очередь bullmq для dl матчинга"
```

### Task 2: Split service into fast create and background process

**Files:**
- Modify: `api/src/telegram-dl-match/telegram-dl-match.service.ts`
- Test: `api/src/telegram-dl-match/telegram-dl-match.service.spec.ts`

- [ ] **Step 1: Write the failing service tests**

```ts
it('createRun enqueues background job and returns RUNNING run', async () => {
  const run = await service.createRun()
  expect(run.status).toBe('RUNNING')
  expect(queue.enqueue).toHaveBeenCalled()
})

it('processRun updates progress per batch and finishes run', async () => {
  await service.processRun('10')
  expect(prisma.dlMatchRun.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ status: 'DONE' }) })
  )
})
```

- [ ] **Step 2: Run service test to verify it fails**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts`
Expected: FAIL because `processRun` and enqueue orchestration do not exist.

- [ ] **Step 3: Refactor service**

Run: implement:
- `createRun()`:
  - create `DlMatchRun`
  - enqueue `{ runId }`
  - return mapped `RUNNING` run
- `processRun(runId)`:
  - count contacts
  - iterate by cursor in batches
  - build bulk lookup maps
  - persist results batch-by-batch
  - update progress counters after each batch
  - finish with `DONE` or `FAILED`

Expected: no synchronous heavy work left in controller path.

- [ ] **Step 4: Add batch progress logs**

```ts
this.logger.log(
  `Матчинг DL batch: runId=${runId} processed=${processed}/${estimatedTotal} batchMatches=${results.length} durationMs=${durationMs}`
)
```

- [ ] **Step 5: Run targeted tests**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
Expected: PASS.

- [ ] **Step 6: Run static verification**

Run:
- `cd api && bun run typecheck`
- `cd api && bun run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/src/telegram-dl-match/telegram-dl-match.service.ts api/src/telegram-dl-match/telegram-dl-match.service.spec.ts
git commit -m "feat: вынести dl матчинг в фоновую обработку"
```

### Task 3: Add processor error handling and run failure updates

**Files:**
- Modify: `api/src/telegram-dl-match/queues/telegram-dl-match.processor.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.service.ts`
- Test: `api/src/telegram-dl-match/telegram-dl-match.service.spec.ts`

- [ ] **Step 1: Write the failing error-path test**

```ts
it('marks run as FAILED when processor throws', async () => {
  await expect(service.processRun('10')).rejects.toThrow('boom')
  expect(prisma.dlMatchRun.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) })
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts`
Expected: FAIL if failure path does not persist status and error.

- [ ] **Step 3: Implement failure handling**

Run: ensure both queue processor and service:
- log error with `runId`, `processed`, `lastContactId`
- persist `FAILED`
- save `error` string to run row

- [ ] **Step 4: Run targeted tests**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram-dl-match/queues/telegram-dl-match.processor.ts api/src/telegram-dl-match/telegram-dl-match.service.ts api/src/telegram-dl-match/telegram-dl-match.service.spec.ts
git commit -m "fix: добавить обработку ошибок очереди dl матчинга"
```

## Chunk 2: Frontend polling and progress UX

### Task 4: Poll active run status while DL match is running

**Files:**
- Modify: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts`
- Modify: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.types.ts`
- Test: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`

- [ ] **Step 1: Write the failing polling test**

```tsx
it('polls active run until status becomes DONE', async () => {
  expect(telegramDlUploadService.getMatchRun).toHaveBeenCalledTimes(2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: FAIL because polling is not enabled for `RUNNING`.

- [ ] **Step 3: Implement polling in hook**

Run: set `refetchInterval` on active run query only when:
- `activeMatchRunId !== null`
- returned status is `RUNNING`

Expected: hook stops polling automatically on `DONE` or `FAILED`.

- [ ] **Step 4: Surface status to page state**

Run: ensure UI can distinguish:
- `RUNNING`
- `DONE`
- `FAILED`

- [ ] **Step 5: Run targeted tests**

Run: `bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.types.ts front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
git commit -m "feat: добавить polling статуса dl матчинга"
```

### Task 5: Show progress and running state in the match workspace

**Files:**
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchToolbar.tsx`
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchWorkspace.tsx`
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchResultsTable.tsx`
- Test: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`

- [ ] **Step 1: Write the failing UI test**

```tsx
it('shows running progress and disables repeat launch while match is active', async () => {
  expect(screen.getByText(/RUNNING/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Найти совпадения/i })).toBeDisabled()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: FAIL because UI does not yet reflect background status clearly.

- [ ] **Step 3: Implement minimal running-state UX**

Run: update toolbar/workspace so that:
- launch button disabled while `RUNNING`
- summary uses live counters from active run
- results area shows `Матчинг выполняется` until `DONE`
- `FAILED` shows `run.error`

- [ ] **Step 4: Run targeted tests**

Run: `bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run frontend verification**

Run:
- `cd front && bun run typecheck`
- `cd front && bun run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add front/src/modules/telegram-dl-upload/components front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
git commit -m "feat: показать прогресс фонового dl матчинга"
```

## Chunk 3: Integration verification

### Task 6: Run focused end-to-end verification for queue-based DL match

**Files:**
- Verify only: `api/src/telegram-dl-match/**`
- Verify only: `front/src/modules/telegram-dl-upload/**`

- [ ] **Step 1: Run backend targeted suite**

Run:
- `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
- `cd api && bun run typecheck`
- `cd api && bun run build`

Expected: PASS.

- [ ] **Step 2: Run frontend targeted suite**

Run:
- `bun --cwd front test src/modules/telegram-dl-upload/api/__tests__/telegramDlUpload.api.test.ts src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
- `cd front && bun run typecheck`
- `cd front && bun run build`

Expected: PASS.

- [ ] **Step 3: Commit final integration state**

```bash
git add api/src/telegram-dl-match front/src/modules/telegram-dl-upload
git commit -m "test: проверить фоновый dl матчинг"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-25-telegram-dl-match-queue.md`. Ready to execute?

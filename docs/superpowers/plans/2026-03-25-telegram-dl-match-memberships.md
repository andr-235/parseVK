# Telegram DL Match Memberships Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в результаты DL-матчинга все связи найденного `tgmbase user` с `group`, `supergroup` и `channel` и показать их в API, UI и `xlsx`-экспорте.

**Architecture:** Backend расширяет batched DL-match pipeline ещё одним bulk lookup membership-данных и сохраняет их в `tgmbaseUserSnapshot.memberships`. Frontend добавляет новую колонку `Связи tgmbase`, а exporter пишет все связи пользователя в отдельную ячейку через перевод строки.

**Tech Stack:** NestJS, Prisma tgmbase client или raw SQL fallback, BullMQ worker, React 19, TanStack Query, Vitest, Testing Library, XLSX exporter.

---

## Chunk 1: Discover and model tgmbase memberships

### Task 1: Identify the actual membership tables in tgmbase

**Files:**
- Modify: `api/prisma/tgmbase.prisma`
- Test: `api/src/tgmbase-prisma/tgmbase-schema.spec.ts`
- Reference: real tgmbase database schema

- [ ] **Step 1: Inspect the real tgmbase schema**

Run a schema inspection against the live/deploy tgmbase and identify:
- membership table names
- foreign keys to `user`
- foreign keys to `group`, `supergroup`, `channel`
- the status columns that indicate an active/current membership if such columns exist

Expected: a clear table map for all supported relationship types.

- [ ] **Step 2: Write the failing schema test**

```ts
it('contains tgmbase membership models needed for DL match enrichment', async () => {
  const schema = await readFile('prisma/tgmbase.prisma', 'utf8')
  expect(schema).toMatch(/model .*Membership/)
})
```

- [ ] **Step 3: Extend `tgmbase.prisma` with the required membership models**

Run: add only the minimal models/relations needed for:
- user -> memberships
- membership -> target entity (`group`, `supergroup`, `channel`)

Expected: the generated tgmbase client can query membership relations in a typed way.

- [ ] **Step 4: Regenerate tgmbase Prisma client**

Run: `cd api && bun run prisma:generate:tgmbase`
Expected: PASS.

- [ ] **Step 5: Run targeted schema verification**

Run: `bun --cwd api test src/tgmbase-prisma/tgmbase-schema.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/prisma/tgmbase.prisma api/src/tgmbase-prisma/tgmbase-schema.spec.ts api/src/generated/tgmbase
git commit -m "feat: добавить модели связей tgmbase для dl матчинга"
```

## Chunk 2: Enrich DL match snapshots with memberships

### Task 2: Add membership lookup and snapshot enrichment in the DL match worker

**Files:**
- Modify: `api/src/telegram-dl-match/telegram-dl-match.service.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.service.spec.ts`

- [ ] **Step 1: Write the failing service test**

```ts
it('adds memberships to tgmbase user snapshot', async () => {
  const run = await service.processRun('10')
  expect(prisma.dlMatchResult.createMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.arrayContaining([
        expect.objectContaining({
          tgmbaseUserSnapshot: expect.objectContaining({
            memberships: [
              expect.objectContaining({
                type: 'group',
                group_id: '10001',
                title: 'Test Group',
              }),
            ],
          }),
        }),
      ]),
    }),
  )
})
```

- [ ] **Step 2: Run targeted service tests to confirm failure**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts`
Expected: FAIL because memberships are not yet loaded or serialized.

- [ ] **Step 3: Implement a bulk membership lookup helper**

Run: add a helper in `telegram-dl-match.service.ts` that:
- accepts unique `user_id[]` for a batch
- queries all membership rows in bulk
- maps them to `{ type, group_id, title }`
- groups them by `user_id`

Expected: no per-result membership queries.

- [ ] **Step 4: Extend `buildUserSnapshot()`**

Run: change the snapshot builder so it accepts the memberships for the matched user and persists:

```ts
memberships: [
  { type: 'group', group_id: '10001', title: '...' },
]
```

Expected: every matched user snapshot contains `memberships`, even if it is an empty array.

- [ ] **Step 5: Add membership-stage logs**

Run: log batch membership lookup with `runId`, `batchUsers`, `membershipCount`, `durationMs`.
Expected: backend logs show that the worker is progressing through the enrichment stage as well.

- [ ] **Step 6: Run targeted backend verification**

Run:
- `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
- `cd api && bun run typecheck`
- `cd api && bun run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/src/telegram-dl-match/telegram-dl-match.service.ts api/src/telegram-dl-match/telegram-dl-match.service.spec.ts
git commit -m "feat: добавить связи tgmbase в снапшот dl матчинга"
```

### Task 3: Expose memberships in result DTO and exporter

**Files:**
- Modify: `api/src/telegram-dl-match/dto/telegram-dl-match-response.dto.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.service.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.exporter.ts`
- Test: `api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
- Test: exporter test file if present, otherwise create targeted coverage near exporter

- [ ] **Step 1: Write the failing API/export test**

```ts
it('returns memberships in result user payload', async () => {
  await expect(service.getResults('1')).resolves.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: expect.objectContaining({
          memberships: expect.any(Array),
        }),
      }),
    ]),
  )
})
```

- [ ] **Step 2: Run targeted test to verify failure**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
Expected: FAIL because DTO/result mapping does not yet expose memberships.

- [ ] **Step 3: Update DTO mapping**

Run: extend the result DTO and `mapResult()` so `user.memberships` is returned as part of the API payload.
Expected: controller returns memberships without changing route structure.

- [ ] **Step 4: Extend XLSX export formatting**

Run: serialize memberships into one export cell with newline-separated lines:

```text
group: ЖК Центральный чат (10001)
channel: Новости района (20002)
```

Expected: export contains all relationships without truncation.

- [ ] **Step 5: Run targeted backend verification**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/src/telegram-dl-match/dto/telegram-dl-match-response.dto.ts api/src/telegram-dl-match/telegram-dl-match.service.ts api/src/telegram-dl-match/telegram-dl-match.exporter.ts api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts
git commit -m "feat: отдать и экспортировать связи tgmbase в dl матчинге"
```

## Chunk 3: Show memberships in the DL match UI

### Task 4: Render memberships in the results table

**Files:**
- Modify: `front/src/modules/telegram-dl-upload/api/telegramDlUpload.api.ts`
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchResultsTable.tsx`
- Modify: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`

- [ ] **Step 1: Write the failing UI test**

```tsx
it('renders tgmbase memberships for a matched user', async () => {
  expect(await screen.findByText(/group: Test Group \(10001\)/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run targeted frontend test to verify failure**

Run: `bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: FAIL because the result model and table do not show memberships.

- [ ] **Step 3: Extend frontend API types**

Run: update the DL match result types so `user.memberships` is typed as an array of:
- `type`
- `group_id`
- `title`

Expected: the table component receives typed memberships.

- [ ] **Step 4: Add the `Связи tgmbase` column**

Run: render:
- newline/stacked list of all memberships
- `Нет данных` when the array is empty
- compact container with bounded height and internal scroll if needed

Expected: the table remains readable with many memberships.

- [ ] **Step 5: Run targeted frontend verification**

Run:
- `bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
- `cd front && bun run typecheck`
- `cd front && bun run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add front/src/modules/telegram-dl-upload/api/telegramDlUpload.api.ts front/src/modules/telegram-dl-upload/components/TelegramDlMatchResultsTable.tsx front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
git commit -m "feat: показать связи tgmbase в результатах dl матчинга"
```

## Chunk 4: Final verification

### Task 5: Run end-to-end verification for the feature slice

**Files:**
- Verify only

- [ ] **Step 1: Run backend targeted tests**

Run:
- `bun --cwd api test src/tgmbase-prisma/tgmbase-schema.spec.ts src/telegram-dl-match/telegram-dl-match.service.spec.ts src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
- `cd api && bun run typecheck`
- `cd api && bun run build`

Expected: PASS.

- [ ] **Step 2: Run frontend targeted tests**

Run:
- `bun --cwd front test src/modules/telegram-dl-upload/api/__tests__/telegramDlUpload.api.test.ts src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
- `cd front && bun run typecheck`
- `cd front && bun run build`

Expected: PASS.

- [ ] **Step 3: Verify clean git state**

Run: `git status --short`
Expected: no unexpected files.

- [ ] **Step 4: Final commit if verification changed anything**

```bash
git add -A
git commit -m "chore: завершить проверку связей tgmbase в dl матчинге"
```

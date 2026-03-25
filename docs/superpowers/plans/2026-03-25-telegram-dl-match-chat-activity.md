# Telegram DL Match Chat Activity Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать `chatActivityMatch` полноценным типом совпадения, добавить исключение `peer_id` с быстрым пересчётом результата и показать все комментарии пользователя по найденным чатам.

**Architecture:** Backend расширяет текущий worker DL-matching новыми таблицами `dl_match_result_chat` и `dl_match_result_message`, сохраняет chats/messages bulk-образом, а затем пересчитывает активность через `is_excluded`. Frontend добавляет действия исключения и lazy-load комментариев по строке результата.

**Tech Stack:** NestJS, Prisma tgmbase client, BullMQ worker, PostgreSQL, React 19, TanStack Query, Vitest, Testing Library, XLSX exporter.

---

## Chunk 1: Model chat activity results in tgmbase

### Task 1: Add schema support for result chats/messages

**Files:**
- Modify: `api/prisma/tgmbase.prisma`
- Add: `api/prisma/tgmbase-migrations/*_add_dl_match_chat_activity_tables.sql`
- Test: `api/src/tgmbase-prisma/tgmbase-schema.spec.ts`

- [ ] **Step 1: Write failing schema expectations**

Add coverage that `tgmbase.prisma` contains:
- `DlMatchResultChat`
- `DlMatchResultMessage`
- `chatActivityMatch` on `DlMatchResult`

- [ ] **Step 2: Extend Prisma schema**

Add:
- `chatActivityMatch Boolean`
- `DlMatchResultChat`
- `DlMatchResultMessage`

Expected: schema models both exclusion targets and stored comments.

- [ ] **Step 3: Add tgmbase SQL migration**

Create SQL migration for:
- new boolean column on `dl_match_result`
- new tables and indexes:
  - `run/result_id`
  - `peer_id`
  - `message_id`

Expected: deploy path can create the required storage.

- [ ] **Step 4: Regenerate tgmbase Prisma client**

Run: `cd api && bun run prisma:generate:tgmbase`
Expected: PASS.

- [ ] **Step 5: Run targeted schema verification**

Run: `bun --cwd api test src/tgmbase-prisma/tgmbase-schema.spec.ts`
Expected: PASS.

## Chunk 2: Persist chat activity and comments in the worker

### Task 2: Extend DL match processing with activity-based signal

**Files:**
- Modify: `api/src/telegram-dl-match/telegram-dl-match.service.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.service.spec.ts`

- [ ] **Step 1: Write failing service tests**

Add tests for:
- `chatActivityMatch` becomes `true` when matched user has resolved chats/messages
- worker writes `dlMatchResultChat`
- worker writes `dlMatchResultMessage`

- [ ] **Step 2: Run targeted tests to confirm failure**

Run: `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Add bulk loaders for chat activity**

Implement helpers that:
- collect `message` rows for matched user ids
- resolve `peer_id` to `group/supergroup/channel`
- group chats/messages by `user_id`

Expected: no per-user or per-result chat lookup.

- [ ] **Step 4: Persist normalized results**

During batch processing:
- create `dl_match_result`
- create related `dl_match_result_chat`
- create related `dl_match_result_message`
- set `chatActivityMatch = true` if there is at least one resolved chat

Expected: run stores both signals and full comments.

- [ ] **Step 5: Add progress logs**

Log:
- `runId`
- `batchUsers`
- `resolvedChats`
- `persistedMessages`
- `durationMs`

Expected: logs clearly show activity-enrichment progress.

- [ ] **Step 6: Run targeted backend verification**

Run:
- `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
- `cd api && bun run typecheck`
- `cd api && bun run build`

Expected: PASS.

## Chunk 3: Add exclusion and recalculation API

### Task 3: Exclude and restore peer ids without rerunning the whole match

**Files:**
- Modify: `api/src/telegram-dl-match/telegram-dl-match.controller.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.service.ts`
- Add: `api/src/telegram-dl-match/dto/excluded-chat.dto.ts`
- Test: `api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
- Test: `api/src/telegram-dl-match/telegram-dl-match.service.spec.ts`

- [ ] **Step 1: Write failing exclusion tests**

Cover:
- excluding `peerId` marks chats excluded
- recalculates `chatActivityMatch`
- hides results with no active signals left
- restoring `peerId` returns results

- [ ] **Step 2: Run targeted tests to confirm failure**

Run:
- `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts src/telegram-dl-match/telegram-dl-match.controller.spec.ts`

Expected: FAIL.

- [ ] **Step 3: Implement exclusion service methods**

Add:
- `excludeChat(runId, peerId)`
- `restoreChat(runId, peerId)`
- transactional recomputation for affected `result_id`

Expected: no full-run reprocessing.

- [ ] **Step 4: Filter result queries by active signals**

Update `GET /results` so it returns only rows where at least one signal remains active:
- `strictTelegramIdMatch`
- `usernameMatch`
- `phoneMatch`
- `chatActivityMatch`

Expected: excluded-only results disappear automatically.

- [ ] **Step 5: Run targeted backend verification**

Run:
- `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts src/telegram-dl-match/telegram-dl-match.controller.spec.ts`

Expected: PASS.

## Chunk 4: Expose comments and export active data

### Task 4: Add messages endpoint and update exporter

**Files:**
- Modify: `api/src/telegram-dl-match/dto/telegram-dl-match-response.dto.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.controller.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.exporter.ts`
- Test: exporter/controller coverage near the same module

- [ ] **Step 1: Write failing API/export tests**

Cover:
- `GET /results/:resultId/messages` returns grouped comments
- export excludes excluded chats/messages
- API exposes `chatActivityMatch`

- [ ] **Step 2: Implement messages endpoint**

Return:
- chat metadata
- `isExcluded`
- all messages

Expected: frontend can lazy-load comments by result row.

- [ ] **Step 3: Update exporter**

Export only active chats/messages.

Expected: xlsx matches visible results.

- [ ] **Step 4: Run targeted backend verification**

Run:
- `bun --cwd api test src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
- `cd api && bun run typecheck`
- `cd api && bun run build`

Expected: PASS.

## Chunk 5: Add exclusion UX and comments UI

### Task 5: Update the DL match frontend

**Files:**
- Modify: `front/src/modules/telegram-dl-upload/api/telegramDlUpload.api.ts`
- Modify: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts`
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchResultsTable.tsx`
- Add or modify tests in `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Cover:
- badge `Chat activity match`
- exclude button per chat
- row disappears when only `chatActivityMatch` remains and its chat is excluded
- comments detail-view loads and shows all messages

- [ ] **Step 2: Implement API methods**

Add frontend client methods for:
- exclude chat
- restore chat
- load result messages

- [ ] **Step 3: Update hook state**

Handle:
- active run invalidation
- row-level messages loading
- optimistic refresh after exclusion

- [ ] **Step 4: Redesign result row details**

Keep the table dense, but add expandable detail-view per row for comments.

Expected: comments do not turn the whole table into a vertical wall.

- [ ] **Step 5: Run targeted frontend verification**

Run:
- `bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
- `cd front && bun run typecheck`
- `cd front && bun run build`

Expected: PASS.

## Final Verification

- [ ] Run:
  - `bun --cwd api test src/telegram-dl-match/telegram-dl-match.service.spec.ts src/telegram-dl-match/telegram-dl-match.controller.spec.ts src/tgmbase-prisma/tgmbase-schema.spec.ts`
  - `cd api && bun run typecheck`
  - `cd api && bun run build`
  - `bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
  - `cd front && bun run typecheck`
  - `cd front && bun run build`

- [ ] Validate on deploy stack:
  - run new tgmbase migration
  - start a DL match
  - exclude one `peer_id`
  - confirm rows held only by `chatActivityMatch` disappear
  - confirm comments endpoint and export ignore excluded chats

- [ ] Commit with Russian message, for example:

```bash
git add api front docs
git commit -m "feat: добавить исключение чатов и комментарии в dl матчинг"
```

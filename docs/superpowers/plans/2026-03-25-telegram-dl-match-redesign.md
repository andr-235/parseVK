# Telegram DL Match Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить deploy новой tgmbase-миграции и переработать `Telegram DL` в production-ready экран с двумя вкладками `Импорт DL` и `Матчинг DL`.

**Architecture:** Backend получает точечный deploy-fix в `backend-entrypoint.sh`, чтобы таблицы `dl_match_run` и `dl_match_result` реально создавались в tgmbase. Frontend перераскладывает текущую страницу `telegram-dl-upload` в двухвкладочный table-first интерфейс, где импорт и матчинг становятся отдельными рабочими режимами, а вкладка матчинга стартует с полной DL-базы и переключается в результаты последнего запуска.

**Tech Stack:** shell deploy entrypoint, NestJS backend API, React 19, TanStack Query, Vitest, Testing Library, Tailwind.

---

## Chunk 1: Deploy fix for tgmbase match tables

### Task 1: Add dl-match tgmbase migration to deploy entrypoint

**Files:**
- Modify: `docker/backend-entrypoint.sh`
- Test: `docker/backend-entrypoint.sh` via targeted grep/assertion command

- [ ] **Step 1: Write the failing deploy regression check**

Run:
```bash
rg -n "20260325120000_add_dl_match_tables.sql" docker/backend-entrypoint.sh
```

Expected: no matches yet, confirming the deploy script does not apply the new tgmbase migration.

- [ ] **Step 2: Implement the minimal deploy fix**

Add a second `prisma db execute` call after the existing DL import migration:

```sh
if ! $PRISMA_CMD db execute \
  --config prisma.tgmbase.config.ts \
  --file prisma/tgmbase-migrations/20260325120000_add_dl_match_tables.sql; then
  echo "ОШИБКА: не удалось применить tgmbase SQL-миграцию dl_match."
  exit 1
fi
```

- [ ] **Step 3: Verify the deploy regression check now passes**

Run:
```bash
rg -n "20260325120000_add_dl_match_tables.sql" docker/backend-entrypoint.sh
```

Expected: one match.

- [ ] **Step 4: Commit**

```bash
git add docker/backend-entrypoint.sh
git commit -m "fix: добавить миграцию dl match в deploy entrypoint"
```

## Chunk 2: Restructure Telegram DL page into two tabs

### Task 2: Add tab state and split page into Import/Match workspaces

**Files:**
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadPage.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlTabs.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlImportWorkspace.tsx`
- Modify: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`

- [ ] **Step 1: Write the failing page tests**

Add tests that assert:
- both tabs render
- page starts in `Импорт DL`
- switching to `Матчинг DL` shows the match workspace and hides the import workspace

- [ ] **Step 2: Run the page test to verify failure**

Run:
```bash
bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
```

Expected: FAIL because there is no tab switch and both workspaces are still composed linearly.

- [ ] **Step 3: Implement the tab split**

Refactor page structure to:
- keep a compact hero
- render `TelegramDlTabs`
- render either `TelegramDlImportWorkspace` or `TelegramDlMatchWorkspace`

Expected: match UI is no longer below import UI in one long page.

- [ ] **Step 4: Re-run page tests**

Run:
```bash
bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
```

Expected: PASS for tab switching.

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/telegram-dl-upload/components/TelegramDlUploadPage.tsx front/src/modules/telegram-dl-upload/components/TelegramDlTabs.tsx front/src/modules/telegram-dl-upload/components/TelegramDlImportWorkspace.tsx front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
git commit -m "feat: разделить telegram dl на вкладки импорта и матчинга"
```

### Task 3: Redesign Match tab into a table-first workspace

**Files:**
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchWorkspace.tsx`
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchToolbar.tsx`
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlContactsTable.tsx`
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchResultsTable.tsx`
- Optionally create: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchSummary.tsx`
- Modify: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts`
- Modify: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.types.ts`
- Test: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`

- [ ] **Step 1: Write or extend failing tests for the match UX**

Add assertions for:
- `Матчинг DL` starts with full DL table
- `Найти совпадения` switches to results mode
- `Показать всю DL-базу` returns to contact mode
- compact summary is shown only when a run exists
- `Выгрузить XLSX` is disabled without a completed run

- [ ] **Step 2: Run the page test in red state**

Run:
```bash
bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
```

Expected: FAIL until the current long-form match workspace is reworked.

- [ ] **Step 3: Implement the table-first match tab**

Refine the workspace so it has:
- compact action bar
- optional compact summary strip
- full DL table as default state
- results table only after run selection/execution

Expected: no long stacked decorative layout, only compact operational UI.

- [ ] **Step 4: Re-run the page test**

Run:
```bash
bun --cwd front test src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/telegram-dl-upload/components/TelegramDlMatchWorkspace.tsx front/src/modules/telegram-dl-upload/components/TelegramDlMatchToolbar.tsx front/src/modules/telegram-dl-upload/components/TelegramDlContactsTable.tsx front/src/modules/telegram-dl-upload/components/TelegramDlMatchResultsTable.tsx front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.types.ts front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
git commit -m "feat: переработать ux вкладки матчинга dl"
```

## Chunk 3: Verification and regression coverage

### Task 4: Verify deploy contract and frontend module checks

**Files:**
- Modify if needed after verification: `docker/backend-entrypoint.sh`
- Modify if needed after verification: `front/src/modules/telegram-dl-upload/**`
- Test: `front/src/modules/telegram-dl-upload/api/__tests__/telegramDlUpload.api.test.ts`
- Test: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`

- [ ] **Step 1: Run targeted frontend tests**

Run:
```bash
bun --cwd front test src/modules/telegram-dl-upload/api/__tests__/telegramDlUpload.api.test.ts src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run frontend typecheck**

Run:
```bash
cd front && bun run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run:
```bash
cd front && bun run build
```

Expected: PASS.

- [ ] **Step 4: Re-run backend deploy presence check**

Run:
```bash
rg -n "20260324160500_add_dl_import_tables.sql|20260325120000_add_dl_match_tables.sql" docker/backend-entrypoint.sh
```

Expected: both tgmbase SQL files are referenced in deploy order.

- [ ] **Step 5: Commit final cleanup if needed**

```bash
git add docker/backend-entrypoint.sh front/src/modules/telegram-dl-upload
git commit -m "test: проверить deploy и ux telegram dl"
```

## Notes for execution

- Не менять backend API матчинга без необходимости: текущая бизнес-логика уже есть, задача этой итерации — deploy-fix и UX-rework.
- На вкладке `Матчинг DL` не добавлять историю запусков: пользователь явно попросил показывать только последний запуск.
- Не превращать summary в набор огромных карточек: это должна быть компактная рабочая полоса метрик.
- Таблица полной базы должна быть default-first, а не спрятанной за дополнительным кликом.

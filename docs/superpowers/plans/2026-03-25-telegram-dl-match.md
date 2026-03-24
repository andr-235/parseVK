# Telegram DL Match Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить сохранённый матчинг `DlContact -> tgmbase.user` с просмотром полной DL-базы, запуском сопоставления, показом найденных совпадений и экспортом результата в `xlsx`.

**Architecture:** Бэкенд получает новый модуль `telegram-dl-match`, работающий поверх `TgmbasePrismaService` и новых таблиц `DlMatchRun`/`DlMatchResult` в `tgmbase`. Фронтенд расширяет существующий модуль `telegram-dl-upload`: исходная таблица всех DL-контактов остаётся на странице, а после запуска матчинга экран переключается на сохранённые результаты последнего запуска и умеет выгружать их в `xlsx`.

**Tech Stack:** NestJS, Prisma tgmbase client, ExcelJS, React 19, TanStack Query, Vitest, Testing Library.

---

## Chunk 1: Backend schema and match pipeline

### Task 1: Add tgmbase schema for match runs and results

**Files:**
- Modify: `api/prisma/tgmbase.prisma`
- Create: `api/prisma/tgmbase-migrations/20260325xxxxxx_add_dl_match_tables.sql`
- Test: `api/src/tgmbase-prisma/tgmbase-schema.spec.ts`

- [ ] **Step 1: Write the failing schema test**

```ts
it('defines dl match run and result models in tgmbase schema', () => {
  expect(schema).toMatch(/model DlMatchRun \{/)
  expect(schema).toMatch(/model DlMatchResult \{/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd api test api/src/tgmbase-prisma/tgmbase-schema.spec.ts`
Expected: FAIL because `DlMatchRun` and `DlMatchResult` are absent.

- [ ] **Step 3: Write minimal schema and SQL migration**

```prisma
model DlMatchRun {
  id                 BigInt          @id @default(autoincrement())
  status             String          @db.VarChar(32)
  contactsTotal      Int             @default(0) @map("contacts_total")
  matchesTotal       Int             @default(0) @map("matches_total")
  strictMatchesTotal Int             @default(0) @map("strict_matches_total")
  usernameMatchesTotal Int           @default(0) @map("username_matches_total")
  phoneMatchesTotal  Int             @default(0) @map("phone_matches_total")
  createdAt          DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  finishedAt         DateTime?       @map("finished_at") @db.Timestamptz(6)
  error              String?         @db.Text
  results            DlMatchResult[]

  @@map("dl_match_run")
}
```

- [ ] **Step 4: Generate tgmbase Prisma client**

Run: `bun --cwd api run prisma:generate:tgmbase`
Expected: PASS, generated files updated under `api/src/generated/tgmbase/`.

- [ ] **Step 5: Run schema test to verify it passes**

Run: `bun --cwd api test api/src/tgmbase-prisma/tgmbase-schema.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/prisma/tgmbase.prisma api/prisma/tgmbase-migrations/20260325xxxxxx_add_dl_match_tables.sql api/src/tgmbase-prisma/tgmbase-schema.spec.ts api/src/generated/tgmbase
git commit -m "feat: добавить схему матчинга dl и tgmbase"
```

### Task 2: Build match service with persisted results

**Files:**
- Create: `api/src/telegram-dl-match/telegram-dl-match.service.ts`
- Create: `api/src/telegram-dl-match/telegram-dl-match.module.ts`
- Create: `api/src/telegram-dl-match/telegram-dl-match.exporter.ts`
- Create: `api/src/telegram-dl-match/dto/telegram-dl-match-run-response.dto.ts`
- Create: `api/src/telegram-dl-match/dto/telegram-dl-match-results-query.dto.ts`
- Modify: `api/src/app.module.ts`
- Test: `api/src/telegram-dl-match/telegram-dl-match.service.spec.ts`

- [ ] **Step 1: Write the failing service tests**

```ts
it('creates strict matches by telegramId and stores aggregates', async () => {
  await expect(service.createRun()).resolves.toMatchObject({
    status: 'DONE',
    contactsTotal: 1,
    matchesTotal: 1,
    strictMatchesTotal: 1,
  })
})

it('creates non-strict matches by username and phone', async () => {
  const run = await service.createRun()
  expect(results).toContainEqual(
    expect.objectContaining({ usernameMatch: true, strictTelegramIdMatch: false })
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd api test api/src/telegram-dl-match/telegram-dl-match.service.spec.ts`
Expected: FAIL because module and service do not exist.

- [ ] **Step 3: Implement minimal service and exporter**

```ts
const strictMatches = contact.telegramId
  ? await this.prisma.user.findMany({ where: { user_id: BigInt(contact.telegramId) } })
  : []

const usernameMatches = contact.username
  ? await this.prisma.user.findMany({ where: { username: contact.username } })
  : []
```

- [ ] **Step 4: Make result storage atomic per run**

Run: implement `createRun()` so it:
- creates `DlMatchRun` with `RUNNING`
- loads all `DlContact`
- accumulates `DlMatchResultCreateManyInput[]`
- writes results and final counters
- marks run `FAILED` and stores `error` on exception

Expected: service uses one clear orchestration method and small helpers for match building and snapshot mapping.

- [ ] **Step 5: Run service tests**

Run: `bun --cwd api test api/src/telegram-dl-match/telegram-dl-match.service.spec.ts`
Expected: PASS for strict match, username/phone match, multiple matches, empty matches, failed run status.

- [ ] **Step 6: Commit**

```bash
git add api/src/telegram-dl-match api/src/app.module.ts
git commit -m "feat: добавить сервис матчинга dl и tgmbase"
```

### Task 3: Expose controller endpoints and extend DL contacts API

**Files:**
- Create: `api/src/telegram-dl-match/telegram-dl-match.controller.ts`
- Test: `api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
- Modify: `api/src/telegram-dl-import/telegram-dl-import.service.ts`
- Modify: `api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts`
- Modify: `api/src/telegram-dl-import/telegram-dl-import.service.spec.ts`

- [ ] **Step 1: Write the failing controller and import API tests**

```ts
it('starts a new match run', async () => {
  await expect(controller.createRun()).resolves.toEqual(expect.objectContaining({ status: 'RUNNING' }))
})

it('returns full dl contact fields for the main table', async () => {
  await expect(service.getContacts({})).resolves.toContainEqual(
    expect.objectContaining({ fullName: '...', originalFileName: 'file.xlsx' })
  )
})
```

- [ ] **Step 2: Run targeted tests to verify they fail**

Run: `bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts api/src/telegram-dl-import/telegram-dl-import.service.spec.ts api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
Expected: FAIL because new endpoints and full-contact payload are missing.

- [ ] **Step 3: Implement controller contract**

```ts
@Controller('telegram/dl-match')
export class TelegramDlMatchController {
  @Post('runs')
  createRun() { /* ... */ }

  @Get('runs/:id/export')
  async exportRun(@Param('id') id: string, @Res() res: Response) { /* ... */ }
}
```

- [ ] **Step 4: Extend `getContacts` payload without breaking existing page**

Run: add fields needed for the "full DB" table:
- `description`
- `joinedAt`
- `fullName`
- `address`
- `vkUrl`
- `email`
- `telegramContact`
- `instagram`
- `viber`
- `odnoklassniki`
- `birthDateText`
- `usernameExtra`
- `geo`
- `createdAt`
- `importFileId`
- `originalFileName`

Expected: old consumers still work because added fields are backward-compatible.

- [ ] **Step 5: Run API tests**

Run: `bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts api/src/telegram-dl-import/telegram-dl-import.service.spec.ts api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/src/telegram-dl-import api/src/telegram-dl-match
git commit -m "feat: добавить api матчинга dl и расширить контакты dl"
```

## Chunk 2: Frontend data flow, tables, and export UX

### Task 4: Add frontend API client for contacts, runs, results, and export

**Files:**
- Modify: `front/src/modules/telegram-dl-upload/api/telegramDlUpload.api.ts`
- Modify: `front/src/modules/telegram-dl-upload/api/queryKeys.ts`
- Test: `front/src/modules/telegram-dl-upload/api/__tests__/telegramDlUpload.api.test.ts`
- Reference: `front/src/shared/utils/reportExport.ts`

- [ ] **Step 1: Write the failing API tests**

```ts
it('loads full dl contacts list', async () => {
  await expect(service.getContacts()).resolves.toEqual(expect.any(Array))
})

it('downloads xlsx result blob', async () => {
  await service.exportMatchRun('42')
  expect(saveReportBlob).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run API tests to verify they fail**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/api/__tests__/telegramDlUpload.api.test.ts`
Expected: FAIL because contacts/results/export methods are absent.

- [ ] **Step 3: Implement client methods**

```ts
async getContacts(): Promise<TelegramDlContact[]> { /* GET /telegram/dl-import/contacts */ }
async createMatchRun(): Promise<TelegramDlMatchRun> { /* POST /telegram/dl-match/runs */ }
async getMatchResults(runId: string): Promise<TelegramDlMatchResult[]> { /* GET /runs/:id/results */ }
async exportMatchRun(runId: string): Promise<void> { /* blob + saveReportBlob */ }
```

- [ ] **Step 4: Run API tests**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/api/__tests__/telegramDlUpload.api.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/telegram-dl-upload/api front/src/shared/utils/reportExport.ts
git commit -m "feat: добавить клиент api для матчинга dl"
```

### Task 5: Extend DL page state with two table modes

**Files:**
- Modify: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlContactsTable.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchResultsTable.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlMatchToolbar.tsx`
- Modify: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadPage.tsx`
- Modify: `front/src/modules/telegram-dl-upload/index.ts`
- Test: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`

- [ ] **Step 1: Write the failing page tests**

```tsx
it('shows the full DL contacts table on load', async () => {
  expect(await screen.findByText('Все контакты DL')).toBeInTheDocument()
})

it('runs matching and switches to results mode', async () => {
  await user.click(screen.getByRole('button', { name: /Найти совпадения/i }))
  expect(await screen.findByText('Совпадения tgmbase')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run page test to verify it fails**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: FAIL because tables and run workflow are absent.

- [ ] **Step 3: Implement hook state**

Run: extend `useTelegramDlUpload()` with:
- contacts query
- runs mutation
- active run id
- results query enabled only when run id exists
- export mutation
- derived mode: `'contacts' | 'results'`

Expected: page orchestration stays in hook, UI components remain presentational.

- [ ] **Step 4: Implement tables and toolbar**

Run: create focused components for:
- full contacts table with file/telegramId/username/phone filters
- results table with `ID match` / `Username match` / `Phone match` flags
- toolbar with `Найти совпадения в tgmbase`, `Показать все DL`, `Выгрузить XLSX`

Expected: existing upload card and history panel remain intact.

- [ ] **Step 5: Run page tests**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add front/src/modules/telegram-dl-upload
git commit -m "feat: добавить таблицы и workflow матчинга dl на фронте"
```

### Task 6: Verify end-to-end integration and guard regressions

**Files:**
- Modify: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.service.spec.ts`
- Modify: `api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
- Modify: `front/src/modules/telegram-dl-upload/api/__tests__/telegramDlUpload.api.test.ts`

- [ ] **Step 1: Add edge-case tests**

```ts
it('renders multiple rows for one dl contact when username matches several tgmbase users', async () => {
  expect(screen.getAllByText(/Username match/)).toHaveLength(2)
})

it('disables export while run is pending', async () => {
  expect(screen.getByRole('button', { name: /Выгрузить XLSX/i })).toBeDisabled()
})
```

- [ ] **Step 2: Run backend targeted suite**

Run: `bun --cwd api test api/src/tgmbase-prisma/tgmbase-schema.spec.ts api/src/telegram-dl-import/telegram-dl-import.service.spec.ts api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts api/src/telegram-dl-match/telegram-dl-match.service.spec.ts api/src/telegram-dl-match/telegram-dl-match.controller.spec.ts`
Expected: PASS.

- [ ] **Step 3: Run frontend targeted suite**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/api/__tests__/telegramDlUpload.api.test.ts front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: PASS.

- [ ] **Step 4: Run focused typechecks**

Run: `bun --cwd api run typecheck && bun --cwd front run typecheck`
Expected: PASS.

- [ ] **Step 5: Run focused builds if time permits**

Run: `bun --cwd api run build && bun --cwd front run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/src/telegram-dl-match api/src/telegram-dl-import front/src/modules/telegram-dl-upload docs/superpowers/plans/2026-03-25-telegram-dl-match.md
git commit -m "test: закрыть проверки матчинга dl и tgmbase"
```

## Notes for execution

- Перед реализацией проверить формат `DlContact.telegramId`: если там встречаются префиксы, пробелы или нечисловые значения, нормализацию вынести в небольшой helper рядом с `telegram-dl-match.service.ts`.
- Экспорт `xlsx` строить из сохранённых `DlMatchResult`, а не из повторного запроса в `user`.
- Не смешивать новый модуль с существующим `tgmbase-search`: это отдельный пользовательский workflow и отдельные DTO.
- Для первой версии не добавлять websocket и фоновые очереди, если тестовые данные проходят через обычный HTTP-запуск.

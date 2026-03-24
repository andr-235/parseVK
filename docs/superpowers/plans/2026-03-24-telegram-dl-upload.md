# Telegram DL Upload Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в Telegram-подгруппу страницу `Выгрузка с ДЛ`, которая принимает один или несколько `groupexport_*.xlsx`, импортирует строки в `tgmbase` и заменяет предыдущую активную выгрузку по `group_slug`.

**Architecture:** Функциональность делится на четыре слоя: новые модели в `tgmbase`, backend-модуль импорта с парсером и transactional replace-логикой, frontend-страница загрузки в Telegram-подгруппе и завершающая интеграционная проверка. Импорт опирается на второй Prisma-клиент `tgmbase`, а UI переиспользует существующий `FileUpload` и паттерны Telegram-страниц.

**Tech Stack:** NestJS, Prisma (`tgmbase` schema), React 19, TypeScript, Vite, Tailwind CSS, Vitest, Testing Library.

---

## Chunk 1: Подготовить схему `tgmbase` и каркас backend-модуля

### Task 1: Зафиксировать модели `tgmbase` тестом схемы и fixture-именем

**Files:**
- Modify: `api/prisma/tgmbase.prisma`
- Create: `api/src/telegram-dl-import/utils/parse-groupexport-filename.util.ts`
- Create: `api/src/telegram-dl-import/utils/parse-groupexport-filename.util.spec.ts`
- Reference: `docs/superpowers/specs/2026-03-24-telegram-dl-upload-design.md`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { parseGroupexportFilename } from './parse-groupexport-filename.util'

describe('parseGroupexportFilename', () => {
  it('extracts group slug and export date', () => {
    expect(
      parseGroupexportFilename('groupexport_ab3army_2024-10-15.xlsx')
    ).toEqual({
      groupSlug: 'ab3army',
      exportedAt: '2024-10-15',
      replacementKey: 'ab3army',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd api test src/telegram-dl-import/utils/parse-groupexport-filename.util.spec.ts`
Expected: FAIL because the util and module path do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `parse-groupexport-filename.util.ts` with:
- strict validation of `groupexport_<group_slug>_<yyyy-mm-dd>.xlsx`
- rejection for missing slug/date
- `replacementKey = groupSlug`

Extend `api/prisma/tgmbase.prisma` with models:
- `dl_import_batch`
- `dl_import_file`
- `dl_contact`

Include columns from the approved spec and relations:
- batch -> files
- file -> contacts

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd api test src/telegram-dl-import/utils/parse-groupexport-filename.util.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/prisma/tgmbase.prisma api/src/telegram-dl-import/utils/parse-groupexport-filename.util.ts api/src/telegram-dl-import/utils/parse-groupexport-filename.util.spec.ts
git commit -m "feat: описать tgmbase схему для выгрузки дл"
```

### Task 2: Подключить Prisma client и модуль импорта к приложению

**Files:**
- Create: `api/src/telegram-dl-import/telegram-dl-import.module.ts`
- Create: `api/src/telegram-dl-import/telegram-dl-import.controller.ts`
- Create: `api/src/telegram-dl-import/telegram-dl-import.service.ts`
- Create: `api/src/telegram-dl-import/telegram-dl-import.module.spec.ts`
- Modify: `api/src/app.module.ts`
- Modify: `api/src/telegram/telegram.module.ts`
- Reference: `api/src/tgmbase-prisma/tgmbase-prisma.module.ts`

- [ ] **Step 1: Write the failing module smoke test**

```ts
import { Test } from '@nestjs/testing'
import { TelegramDlImportModule } from './telegram-dl-import.module'

it('builds the dl import module', async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [TelegramDlImportModule],
  }).compile()

  expect(moduleRef).toBeDefined()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd api test src/telegram-dl-import/telegram-dl-import.module.spec.ts`
Expected: FAIL because the module and provider graph do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create the module skeleton with:
- `TgmbasePrismaModule` import
- controller/service registration
- export only what other modules need

Wire it in:
- `api/src/app.module.ts` so HTTP routes are available
- keep `telegram.module.ts` focused on Telegram API sync, not DL import orchestration

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd api test src/telegram-dl-import/telegram-dl-import.module.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram-dl-import/telegram-dl-import.module.ts api/src/telegram-dl-import/telegram-dl-import.controller.ts api/src/telegram-dl-import/telegram-dl-import.service.ts api/src/app.module.ts api/src/telegram/telegram.module.ts api/src/telegram-dl-import/telegram-dl-import.module.spec.ts
git commit -m "feat: подключить модуль импорта выгрузки дл"
```

## Chunk 2: Реализовать backend-парсер, upload API и replace-логику

### Task 3: Зафиксировать парсинг Excel-строк старого и нового формата тестами

**Files:**
- Create: `api/src/telegram-dl-import/services/telegram-dl-import-parser.service.ts`
- Create: `api/src/telegram-dl-import/services/telegram-dl-import-parser.service.spec.ts`
- Reference: `groupexport_ab3army_2024-10-15.xlsx`
- Reference: `groupexport_+4AIahuktDjQxMmU6_2022-11-15.xlsx`

- [ ] **Step 1: Write the failing parser tests**

```ts
it('maps the old sheet format into dl_contact payload', async () => {
  const result = await parser.parse(fileFromFixture('groupexport_+4AIahuktDjQxMmU6_2022-11-15.xlsx'))
  expect(result.rows[0]).toMatchObject({
    telegramId: '655140602',
    phone: '18016003139',
    firstName: 'AZL2054',
  })
})

it('maps the new sheet format and keeps second Username separately', async () => {
  const result = await parser.parse(fileFromFixture('groupexport_ab3army_2024-10-15.xlsx'))
  expect(result.headerMap.usernameExtra).toBeDefined()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd api test src/telegram-dl-import/services/telegram-dl-import-parser.service.spec.ts`
Expected: FAIL because the parser service does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement parser service with:
- XLSX reader used by the backend stack
- first-sheet-only behavior
- header normalization
- positional handling of duplicate `Username`
- row trimming and empty-row skip
- validation for required columns `Id`, `Телефон`, `Дата`

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd api test src/telegram-dl-import/services/telegram-dl-import-parser.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram-dl-import/services/telegram-dl-import-parser.service.ts api/src/telegram-dl-import/services/telegram-dl-import-parser.service.spec.ts
git commit -m "feat: добавить парсер xlsx для выгрузки дл"
```

### Task 4: Реализовать upload endpoint для нескольких файлов

**Files:**
- Modify: `api/src/telegram-dl-import/telegram-dl-import.controller.ts`
- Modify: `api/src/telegram-dl-import/telegram-dl-import.service.ts`
- Create: `api/src/telegram-dl-import/dto/telegram-dl-upload-response.dto.ts`
- Create: `api/src/telegram-dl-import/dto/telegram-dl-file.dto.ts`
- Create: `api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts`

- [ ] **Step 1: Write the failing controller tests**

```ts
it('rejects request without files', async () => {
  await expect(controller.upload([] as Express.Multer.File[])).rejects.toThrow('File is required')
})

it('accepts multiple xlsx files', async () => {
  await controller.upload([fileA, fileB] as Express.Multer.File[])
  expect(service.importFiles).toHaveBeenCalledWith([fileA, fileB])
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd api test src/telegram-dl-import/telegram-dl-import.controller.spec.ts`
Expected: FAIL because the upload route and DTOs do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add:
- `@Post('upload')`
- `FilesInterceptor('files')`
- file presence validation
- `.xlsx` extension validation
- response DTO with batch summary and per-file results

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd api test src/telegram-dl-import/telegram-dl-import.controller.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram-dl-import/telegram-dl-import.controller.ts api/src/telegram-dl-import/telegram-dl-import.service.ts api/src/telegram-dl-import/dto/telegram-dl-upload-response.dto.ts api/src/telegram-dl-import/dto/telegram-dl-file.dto.ts api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts
git commit -m "feat: добавить api загрузки файлов выгрузки дл"
```

### Task 5: Зафиксировать transactional replace-логику тестом сервиса

**Files:**
- Modify: `api/src/telegram-dl-import/telegram-dl-import.service.ts`
- Create: `api/src/telegram-dl-import/telegram-dl-import.service.spec.ts`
- Reference: `api/src/tgmbase-prisma/tgmbase-prisma.service.ts`

- [ ] **Step 1: Write the failing service tests**

```ts
it('activates the new file and deactivates the previous version for the same groupSlug', async () => {
  await service.importFiles([fileA])
  expect(prisma.dl_import_file.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { replacement_key: 'ab3army', is_active: true },
    })
  )
})

it('keeps the previous active version when row insertion fails', async () => {
  prisma.$transaction.mockRejectedValueOnce(new Error('insert failed'))
  await expect(service.importFiles([fileA])).rejects.toThrow('insert failed')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd api test src/telegram-dl-import/telegram-dl-import.service.spec.ts`
Expected: FAIL because the service does not implement transactional replace yet.

- [ ] **Step 3: Write minimal implementation**

Implement service flow:
- create batch
- iterate files independently
- parse filename and sheet rows
- create `dl_import_file` with `RUNNING` and `is_active = false`
- insert `dl_contact` rows
- in one transaction deactivate prior active record and activate new one
- capture per-file errors without aborting sibling files in the same batch

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd api test src/telegram-dl-import/telegram-dl-import.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram-dl-import/telegram-dl-import.service.ts api/src/telegram-dl-import/telegram-dl-import.service.spec.ts
git commit -m "feat: реализовать замену активной выгрузки дл"
```

### Task 6: Добавить history и contacts endpoints

**Files:**
- Modify: `api/src/telegram-dl-import/telegram-dl-import.controller.ts`
- Modify: `api/src/telegram-dl-import/telegram-dl-import.service.ts`
- Create: `api/src/telegram-dl-import/dto/telegram-dl-history-item.dto.ts`
- Create: `api/src/telegram-dl-import/dto/telegram-dl-contact.dto.ts`
- Modify: `api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts`

- [ ] **Step 1: Write the failing controller tests**

```ts
it('returns import file history', async () => {
  await controller.getFiles()
  expect(service.getFiles).toHaveBeenCalled()
})

it('returns imported contacts with filters', async () => {
  await controller.getContacts({ activeOnly: true, groupSlug: 'ab3army' })
  expect(service.getContacts).toHaveBeenCalledWith(expect.objectContaining({ activeOnly: true }))
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd api test src/telegram-dl-import/telegram-dl-import.controller.spec.ts`
Expected: FAIL because the read endpoints do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add:
- `GET /telegram/dl-import/files`
- `GET /telegram/dl-import/contacts`
- pagination/filter DTOs only for the parameters from the spec
- service queries constrained to active records by default

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd api test src/telegram-dl-import/telegram-dl-import.controller.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram-dl-import/telegram-dl-import.controller.ts api/src/telegram-dl-import/telegram-dl-import.service.ts api/src/telegram-dl-import/dto/telegram-dl-history-item.dto.ts api/src/telegram-dl-import/dto/telegram-dl-contact.dto.ts api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts
git commit -m "feat: добавить чтение истории и контактов выгрузки дл"
```

## Chunk 3: Добавить frontend-страницу в Telegram-подгруппу

### Task 7: Зафиксировать навигацию и route тестами

**Files:**
- Modify: `front/src/shared/components/Sidebar/constants.ts`
- Modify: `front/src/shared/components/Sidebar/__tests__/constants.test.ts`
- Modify: `front/src/App.tsx`
- Create: `front/src/pages/TelegramDlUpload.tsx`
- Create: `front/src/modules/telegram-dl-upload/index.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('includes Выгрузка с ДЛ in telegram subitems', () => {
  expect(createTelegramSubItems()).toContainEqual({
    label: 'Выгрузка с ДЛ',
    path: '/telegram/dl-upload',
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd front test front/src/shared/components/Sidebar/__tests__/constants.test.ts`
Expected: FAIL because the new nav item and route do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add:
- sidebar item
- lazy route in `front/src/App.tsx`
- thin page wrapper exporting the future page module

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd front test front/src/shared/components/Sidebar/__tests__/constants.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/shared/components/Sidebar/constants.ts front/src/shared/components/Sidebar/__tests__/constants.test.ts front/src/App.tsx front/src/pages/TelegramDlUpload.tsx front/src/modules/telegram-dl-upload/index.ts
git commit -m "feat: добавить страницу выгрузки дл в навигацию telegram"
```

### Task 8: Добавить API-клиент и hook загрузки нескольких файлов

**Files:**
- Create: `front/src/modules/telegram-dl-upload/api/telegramDlUpload.api.ts`
- Create: `front/src/modules/telegram-dl-upload/api/queryKeys.ts`
- Create: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts`
- Create: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.test.ts`
- Modify: `front/src/shared/types/api.ts`
- Modify: `front/src/shared/types/index.ts`

- [ ] **Step 1: Write the failing hook test**

```ts
it('submits FormData with multiple files', async () => {
  await result.current.uploadFiles([fileA, fileB])
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/telegram/dl-import/upload'),
    expect.objectContaining({ method: 'POST' })
  )
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.test.ts`
Expected: FAIL because the API client and hook do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement:
- typed DTOs for upload result, file history, contacts
- API service for `upload`, `getFiles`, `getContacts`
- hook state for `selectedFiles`, `isUploading`, `results`, `error`

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/telegram-dl-upload/api/telegramDlUpload.api.ts front/src/modules/telegram-dl-upload/api/queryKeys.ts front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.test.ts front/src/shared/types/api.ts front/src/shared/types/index.ts
git commit -m "feat: добавить клиент загрузки выгрузки дл"
```

### Task 9: Собрать экран `Выгрузка с ДЛ` и историю файлов

**Files:**
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadPage.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadHero.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadCard.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadHistory.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/__tests__/TelegramDlUploadPage.test.tsx`
- Reference: `front/src/modules/telegram/components/TelegramPage.tsx`
- Reference: `front/src/shared/components/FileUpload.tsx`

- [ ] **Step 1: Write the failing page tests**

```tsx
it('renders multiple file upload and file status list', () => {
  render(<TelegramDlUploadPage />)
  expect(screen.getByText('Выгрузка с ДЛ')).toBeInTheDocument()
  expect(screen.getByText('можно выбрать несколько файлов')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/components/__tests__/TelegramDlUploadPage.test.tsx`
Expected: FAIL because the page components do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Build the page with:
- hero block in the current Telegram visual language
- upload card using `FileUpload` with `multiple=true`
- selected file list before submit
- upload result list with per-file statuses
- history table for active/imported files

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/components/__tests__/TelegramDlUploadPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/telegram-dl-upload/components/TelegramDlUploadPage.tsx front/src/modules/telegram-dl-upload/components/TelegramDlUploadHero.tsx front/src/modules/telegram-dl-upload/components/TelegramDlUploadCard.tsx front/src/modules/telegram-dl-upload/components/TelegramDlUploadHistory.tsx front/src/modules/telegram-dl-upload/components/__tests__/TelegramDlUploadPage.test.tsx
git commit -m "feat: собрать страницу выгрузки дл"
```

## Chunk 4: Закрыть интеграцию, миграции и верификацию

### Task 10: Подготовить Prisma migration и regeneration для `tgmbase`

**Files:**
- Modify: `api/prisma/tgmbase.prisma`
- Create: `api/prisma/migrations/<timestamp>_add_telegram_dl_import_tables/migration.sql`
- Modify: `api/src/generated/tgmbase/*`

- [ ] **Step 1: Write the failing verification step**

Run: `cd api && bunx prisma validate --schema prisma/tgmbase.prisma`
Expected: FAIL until the final schema is internally consistent and all relations/indexes are valid.

- [ ] **Step 2: Run generation/migration commands**

Run:
- `cd api && bunx prisma validate --schema prisma/tgmbase.prisma`
- `cd api && bunx prisma generate --schema prisma/tgmbase.prisma`
- `cd api && bunx prisma migrate dev --schema prisma/tgmbase.prisma --name add_telegram_dl_import_tables`

Expected:
- schema validates
- client regenerates
- migration SQL is created

- [ ] **Step 3: Fix schema or migration issues**

Adjust:
- relation names
- nullable columns
- indexes/uniqueness for active replacement logic
- generated client imports in the new backend code

- [ ] **Step 4: Re-run validation**

Run:
- `cd api && bunx prisma validate --schema prisma/tgmbase.prisma`
- `cd api && bunx prisma generate --schema prisma/tgmbase.prisma`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/prisma/tgmbase.prisma api/prisma/migrations api/src/generated/tgmbase
git commit -m "feat: добавить миграцию tgmbase для выгрузки дл"
```

### Task 11: Прогнать целевые тесты backend и frontend

**Files:**
- Modify: any failing test files from prior tasks only if needed

- [ ] **Step 1: Run backend test batch**

Run:
- `bun --cwd api test src/telegram-dl-import/utils/parse-groupexport-filename.util.spec.ts`
- `bun --cwd api test src/telegram-dl-import/services/telegram-dl-import-parser.service.spec.ts`
- `bun --cwd api test src/telegram-dl-import/telegram-dl-import.controller.spec.ts`
- `bun --cwd api test src/telegram-dl-import/telegram-dl-import.service.spec.ts`

Expected: PASS

- [ ] **Step 2: Run frontend test batch**

Run:
- `bun --cwd front test front/src/shared/components/Sidebar/__tests__/constants.test.ts`
- `bun --cwd front test front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.test.ts`
- `bun --cwd front test front/src/modules/telegram-dl-upload/components/__tests__/TelegramDlUploadPage.test.tsx`

Expected: PASS

- [ ] **Step 3: Run targeted type/build checks**

Run:
- `bun --cwd api test`
- `bun --cwd front test`
- `bun --cwd front build`

Expected:
- target suites for the new feature pass
- frontend build succeeds

- [ ] **Step 4: Fix only feature-related breakages**

Adjust code/tests/types if the new feature introduced regressions. Avoid unrelated cleanup.

- [ ] **Step 5: Commit**

```bash
git add api front
git commit -m "test: проверить выгрузку дл end-to-end"
```

### Task 12: Проверить UX вручную и подготовить handoff

**Files:**
- Reference: `docs/superpowers/specs/2026-03-24-telegram-dl-upload-design.md`
- Reference: `docs/superpowers/plans/2026-03-24-telegram-dl-upload.md`

- [ ] **Step 1: Start the app locally**

Run:
- `bun --cwd api start:dev`
- `bun --cwd front dev`

Expected: app boots with the new route and backend endpoints.

- [ ] **Step 2: Verify the manual scenario**

Check:
- route `/telegram/dl-upload` opens
- multiple file selection works
- upload shows per-file statuses
- history shows active version only
- re-upload of the same `group_slug` deactivates the older version

- [ ] **Step 3: Capture any mismatches**

If the UI or API deviates from the spec, update the implementation before handoff. Do not change the spec unless the product requirement changed.

- [ ] **Step 4: Run final focused verification**

Run:
- `git status --short`
- final targeted tests from Task 11

Expected: only intended files changed and tests still pass.

- [ ] **Step 5: Commit**

```bash
git add api front docs/superpowers/plans/2026-03-24-telegram-dl-upload.md
git commit -m "feat: завершить реализацию выгрузки дл"
```

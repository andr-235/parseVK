# Telegram DL Upload Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в Telegram-раздел страницу `Выгрузка с ДЛ` с мультизагрузкой `groupexport_*.xlsx` в `tgmbase`, хранением имени файла и заменой предыдущей активной версии по полному имени файла.

**Architecture:** Решение делится на три части: схема `tgmbase` и backend-модуль импорта, frontend-страница и API-клиент, затем верификация через backend/frontend тесты. Данные сохраняются в новых таблицах `dl_import_batch`, `dl_import_file`, `dl_contact`, а активная версия файла определяется по `original_file_name`.

**Tech Stack:** NestJS, Prisma (`tgmbase.prisma`), React, Vite, Vitest, multipart upload через Nest `FileInterceptor`.

---

## File Structure

### Backend

- Modify: `api/prisma/tgmbase.prisma`
  Новые модели `dl_import_batch`, `dl_import_file`, `dl_contact`.
- Create: `api/src/telegram-dl-import/telegram-dl-import.module.ts`
  Новый backend-модуль импорта.
- Create: `api/src/telegram-dl-import/telegram-dl-import.controller.ts`
  Upload/history/contacts endpoints.
- Create: `api/src/telegram-dl-import/telegram-dl-import.service.ts`
  orchestration batch/file import и переключение активной версии.
- Create: `api/src/telegram-dl-import/telegram-dl-import.parser.ts`
  Чтение Excel и mapping колонок.
- Create: `api/src/telegram-dl-import/dto/telegram-dl-import-response.dto.ts`
  DTO upload-ответа.
- Create: `api/src/telegram-dl-import/dto/telegram-dl-import-files-query.dto.ts`
  DTO history-фильтров.
- Create: `api/src/telegram-dl-import/dto/telegram-dl-import-contacts-query.dto.ts`
  DTO contacts-фильтров.
- Create: `api/src/telegram-dl-import/telegram-dl-import.service.spec.ts`
  Основные unit/integration-like тесты сервиса.
- Create: `api/src/telegram-dl-import/telegram-dl-import.parser.spec.ts`
  Тесты парсера Excel-структуры и mapping.
- Modify: `api/src/app.module.ts`
  Подключение нового модуля.

### Frontend

- Modify: `front/src/App.tsx`
  Новый route страницы.
- Modify: `front/src/shared/components/Sidebar/constants.ts`
  Новый пункт `Выгрузка с ДЛ` в Telegram-подгруппе.
- Create: `front/src/pages/TelegramDlUpload.tsx`
  Page wrapper.
- Create: `front/src/modules/telegram-dl-upload/index.ts`
  Публичные экспорты модуля.
- Create: `front/src/modules/telegram-dl-upload/api/telegramDlUpload.api.ts`
  API-клиент upload/history/contacts.
- Create: `front/src/modules/telegram-dl-upload/api/queryKeys.ts`
  Query keys.
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadPage.tsx`
  Основная страница.
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadHero.tsx`
  Hero-блок.
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadCard.tsx`
  Карточка выбора файлов и отправки.
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadHistory.tsx`
  Таблица истории файлов.
- Create: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts`
  Hook загрузки и статусов.
- Create: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
  UI-тесты страницы.
- Modify: `front/src/shared/components/Sidebar/__tests__/constants.test.ts`
  Проверка нового пункта меню.

## Chunk 1: Tgmbase Schema And Parser

### Task 1: Добавить failing tests для parser contract

**Files:**
- Create: `api/src/telegram-dl-import/telegram-dl-import.parser.spec.ts`
- Reference: `docs/superpowers/specs/2026-03-24-telegram-dl-upload-design.md`

- [ ] **Step 1: Write the failing tests**

Добавить кейсы:

- старый формат файла с колонками до `Каналы`;
- новый формат файла с дополнительными колонками;
- различение первого и второго `Username`;
- пропуск пустых строк;
- ошибка при отсутствии обязательных колонок;
- правило замены по полному имени файла.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.parser.spec.ts`
Expected: FAIL, потому что parser еще не существует.

- [ ] **Step 3: Write minimal parser implementation**

**Files:**
- Create: `api/src/telegram-dl-import/telegram-dl-import.parser.ts`

Реализовать:

- чтение `xlsx` через библиотеку, уже используемую проектом или добавленную осознанно;
- mapping русских заголовков на поля `dl_contact`;
- разбор дубля `Username` по позиции колонки;
- нормализацию строк и пропуск пустых строк;
- helper для получения replacement key из полного имени файла без парсинга `slug/date`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.parser.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram-dl-import/telegram-dl-import.parser.ts api/src/telegram-dl-import/telegram-dl-import.parser.spec.ts
git commit -m "test: добавить тесты парсера выгрузки с дл"
```

### Task 2: Добавить tgmbase-модели и failing tests на сервис

**Files:**
- Modify: `api/prisma/tgmbase.prisma`
- Create: `api/src/telegram-dl-import/telegram-dl-import.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Покрыть кейсы:

- batch из нескольких файлов;
- активация новой версии при совпадении `original_file_name`;
- сохранение старой активной версии при падении новой;
- частичный успех batch, если один файл упал.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.service.spec.ts`
Expected: FAIL, потому что сервис и модели еще не готовы.

- [ ] **Step 3: Add Prisma models and generate client**

Добавить в `api/prisma/tgmbase.prisma`:

- `dl_import_batch`
- `dl_import_file`
- `dl_contact`

Сразу заложить:

- FK между таблицами;
- `is_active`;
- `original_file_name`;
- индексы для history и active lookup.

Run:

```bash
bun --cwd api prisma generate --schema prisma/tgmbase.prisma
```

Expected: tgmbase client regenerated without errors.

- [ ] **Step 4: Implement minimal service for tests**

**Files:**
- Create: `api/src/telegram-dl-import/telegram-dl-import.service.ts`

Реализовать:

- создание batch;
- создание file records;
- bulk insert `dl_contact`;
- атомарное переключение `is_active` по полному имени файла;
- статус `FAILED` без деактивации предыдущей версии.

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.service.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/prisma/tgmbase.prisma api/src/telegram-dl-import/telegram-dl-import.service.ts api/src/telegram-dl-import/telegram-dl-import.service.spec.ts api/src/generated/tgmbase
git commit -m "feat: добавить модели и сервис импорта выгрузки с дл"
```

## Chunk 2: Backend HTTP Module

### Task 3: Добавить controller и DTO с TDD

**Files:**
- Create: `api/src/telegram-dl-import/telegram-dl-import.controller.ts`
- Create: `api/src/telegram-dl-import/telegram-dl-import.module.ts`
- Create: `api/src/telegram-dl-import/dto/telegram-dl-import-response.dto.ts`
- Create: `api/src/telegram-dl-import/dto/telegram-dl-import-files-query.dto.ts`
- Create: `api/src/telegram-dl-import/dto/telegram-dl-import-contacts-query.dto.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Write/update failing controller tests**

Если в проекте есть паттерн controller spec рядом с модулем, создать аналогичный spec для:

- `POST /telegram/dl-import/upload`
- `GET /telegram/dl-import/files`
- `GET /telegram/dl-import/contacts`

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement controller/module**

Реализовать:

- `FilesInterceptor` для массива файлов;
- валидацию `xlsx`;
- вызовы сервиса;
- DTO-ответы со статусами batch и файлов;
- подключение модуля в `api/src/app.module.ts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram-dl-import api/src/app.module.ts
git commit -m "feat: добавить api для загрузки выгрузки с дл"
```

### Task 4: Проверить backend целиком по релевантным тестам

**Files:**
- Test: `api/src/telegram-dl-import/telegram-dl-import.parser.spec.ts`
- Test: `api/src/telegram-dl-import/telegram-dl-import.service.spec.ts`
- Test: `api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts`

- [ ] **Step 1: Run targeted backend tests**

Run:

```bash
bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.parser.spec.ts
bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.service.spec.ts
bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts
```

Expected: PASS

- [ ] **Step 2: Run lint/typecheck if available for backend slice**

Run:

```bash
bun --cwd api test --runInBand api/src/telegram-dl-import
```

Expected: PASS or actionable failures only in new module.

- [ ] **Step 3: Commit**

```bash
git add api/src/telegram-dl-import
git commit -m "test: проверить backend модуля выгрузки с дл"
```

## Chunk 3: Frontend Route And Upload Page

### Task 5: Добавить failing frontend tests на navigation and page shell

**Files:**
- Modify: `front/src/shared/components/Sidebar/__tests__/constants.test.ts`
- Create: `front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Покрыть:

- новый пункт `Выгрузка с ДЛ` в `createTelegramSubItems`;
- рендер страницы;
- выбор нескольких файлов;
- отображение списка файлов до отправки;
- вывод статусов после ответа API.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
bun --cwd front test front/src/shared/components/Sidebar/__tests__/constants.test.ts
bun --cwd front test front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement route and page shell**

**Files:**
- Modify: `front/src/App.tsx`
- Modify: `front/src/shared/components/Sidebar/constants.ts`
- Create: `front/src/pages/TelegramDlUpload.tsx`
- Create: `front/src/modules/telegram-dl-upload/index.ts`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadPage.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadHero.tsx`

Реализовать:

- новый route;
- новый sidebar item;
- page shell в визуальном стиле Telegram-раздела.

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
bun --cwd front test front/src/shared/components/Sidebar/__tests__/constants.test.ts
bun --cwd front test front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
```

Expected: PASS or next failing assertions only on upload behavior.

- [ ] **Step 5: Commit**

```bash
git add front/src/App.tsx front/src/shared/components/Sidebar/constants.ts front/src/pages/TelegramDlUpload.tsx front/src/modules/telegram-dl-upload
git commit -m "feat: добавить страницу выгрузки с дл в telegram"
```

### Task 6: Реализовать upload flow и history table

**Files:**
- Create: `front/src/modules/telegram-dl-upload/api/telegramDlUpload.api.ts`
- Create: `front/src/modules/telegram-dl-upload/api/queryKeys.ts`
- Create: `front/src/modules/telegram-dl-upload/hooks/useTelegramDlUpload.ts`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadCard.tsx`
- Create: `front/src/modules/telegram-dl-upload/components/TelegramDlUploadHistory.tsx`

- [ ] **Step 1: Extend failing tests for upload behavior**

Добавить проверки:

- `multipart` upload нескольких файлов;
- отображение статусов `в очереди/загружен/ошибка`;
- обновление history после успешной загрузки.

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement minimal upload flow**

Реализовать:

- API-клиент для upload/files/contacts;
- hook состояния загрузки;
- использование `FileUpload` с `multiple=true`;
- список выбранных файлов;
- карточку истории загруженных файлов.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun --cwd front test front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/telegram-dl-upload
git commit -m "feat: реализовать загрузку и историю выгрузки с дл"
```

## Chunk 4: Verification And Integration

### Task 7: Прогнать релевантную verification matrix

**Files:**
- Test: `api/src/telegram-dl-import/*`
- Test: `front/src/modules/telegram-dl-upload/*`
- Test: `front/src/shared/components/Sidebar/__tests__/constants.test.ts`

- [ ] **Step 1: Run backend tests**

Run:

```bash
bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.parser.spec.ts
bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.service.spec.ts
bun --cwd api test api/src/telegram-dl-import/telegram-dl-import.controller.spec.ts
```

Expected: PASS

- [ ] **Step 2: Run frontend tests**

Run:

```bash
bun --cwd front test front/src/shared/components/Sidebar/__tests__/constants.test.ts
bun --cwd front test front/src/modules/telegram-dl-upload/__tests__/TelegramDlUploadPage.test.tsx
```

Expected: PASS

- [ ] **Step 3: Run targeted build/type validation if available**

Run:

```bash
bun --cwd front build
```

Expected: PASS

- [ ] **Step 4: Summarize residual risks**

Зафиксировать:

- импорт зависит от стабильности заголовков Excel;
- старые inactive версии хранятся в БД и не удаляются автоматически;
- `channels_raw` пока не нормализуется.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: завершить проверку выгрузки с дл"
```

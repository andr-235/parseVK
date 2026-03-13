# Telegram Discussion Comment Authors Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить отдельный Telegram flow для сбора уникальных авторов комментариев из discussion thread или диапазона истории discussion-чата.

**Architecture:** Новый discussion endpoint живёт отдельно от существующего `sync участников`. Resolver переиспользует текущую поддержку public/internal Telegram identifiers, а новый collector читает сообщения/комментарии вместо `participants`, извлекает авторов-пользователей и дедуплицирует их.

**Tech Stack:** NestJS, TypeScript, GramJS, Prisma, React, Vitest

---

## File Structure

### Create

- `api/src/telegram/dto/telegram-discussion-sync.dto.ts`
- `api/src/telegram/dto/telegram-discussion-result.dto.ts`
- `api/src/telegram/services/telegram-discussion-resolver.service.ts`
- `api/src/telegram/services/telegram-comment-author-collector.service.ts`
- `api/src/telegram/services/telegram-discussion-sync.service.ts`
- `api/src/telegram/services/telegram-discussion-resolver.service.spec.ts`
- `api/src/telegram/services/telegram-comment-author-collector.service.spec.ts`
- `front/src/modules/telegram/types/telegramDiscussion.types.ts`

### Modify

- `api/src/telegram/telegram.controller.ts`
- `api/src/telegram/telegram.module.ts`
- `api/src/telegram/telegram.service.ts` or create dedicated orchestrator if cleaner
- `api/src/telegram/utils/normalize-telegram-identifier.util.ts`
- `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
- `api/src/telegram/services/telegram-identifier-resolver.service.ts`
- `api/src/telegram/services/telegram-chat-sync.service.ts` if user persistence can be reused
- `api/src/telegram/telegram.service.spec.ts`
- `front/src/modules/telegram/api/telegram.api.ts`
- `front/src/modules/telegram/hooks/useTelegramSync.ts` or split if discussion flow deserves its own hook
- `front/src/modules/telegram/components/TelegramSyncCard.tsx`
- `front/src/shared/api/apiUtils.ts` if backend errors are still masked

### Verify / related reads

- `api/src/telegram/services/telegram-participant-collector.service.ts`
- `api/src/telegram/interfaces/telegram-client.interface.ts`
- `api/src/telegram/repositories/telegram-chat.repository.ts`

## Chunk 1: Контракт discussion API

### Task 1: Написать failing tests на новый discussion request contract

**Files:**
- Create: `api/src/telegram/telegram.service.spec.ts` updates for discussion flow
- Create: `api/src/telegram/dto/telegram-discussion-sync.dto.ts`

- [ ] **Step 1: Добавить тесты на валидацию режима**

Примеры:

```ts
it('rejects thread mode without messageId when identifier does not contain it', async () => {
  await expect(
    service.syncDiscussionAuthors({
      identifier: '@chatname',
      mode: 'thread',
    }),
  ).rejects.toThrow('Для режима одного треда требуется messageId');
});
```

- [ ] **Step 2: Запустить точечный backend test**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/telegram.service.spec.ts`
Expected: FAIL, потому что discussion flow ещё не реализован.

- [ ] **Step 3: Commit**

```bash
git add api/src/telegram/telegram.service.spec.ts api/src/telegram/dto/telegram-discussion-sync.dto.ts
git commit -m "test: добавить контракт sync авторов обсуждения telegram"
```

### Task 2: Описать DTO и endpoint

**Files:**
- Create: `api/src/telegram/dto/telegram-discussion-sync.dto.ts`
- Create: `api/src/telegram/dto/telegram-discussion-result.dto.ts`
- Modify: `api/src/telegram/telegram.controller.ts`

- [ ] **Step 1: Добавить request DTO**

Поля:

```ts
identifier: string;
mode: 'thread' | 'chatRange';
messageId?: number;
dateFrom?: string;
dateTo?: string;
messageLimit?: number;
authorLimit?: number;
```

- [ ] **Step 2: Добавить result DTO**

Результат должен явно содержать:

```ts
mode: 'thread' | 'chatRange';
source: 'discussion_comments';
authors: TelegramMemberDto[];
fetchedMessages: number;
uniqueAuthors: number;
```

- [ ] **Step 3: Прокинуть новый endpoint в controller**

Например:

```ts
@Post('discussion-authors/sync')
syncDiscussionAuthors(...)
```

- [ ] **Step 4: Запустить controller/service tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/telegram.service.spec.ts`
Expected: FAIL на ещё отсутствующей реализации, но контракт должен компилироваться.

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram/dto/telegram-discussion-sync.dto.ts api/src/telegram/dto/telegram-discussion-result.dto.ts api/src/telegram/telegram.controller.ts
git commit -m "feat: добавить контракт sync авторов обсуждения telegram"
```

## Chunk 2: Resolver discussion inputs

### Task 3: Написать failing tests для messageId extraction и thread mode

**Files:**
- Modify: `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
- Create: `api/src/telegram/services/telegram-discussion-resolver.service.spec.ts`

- [ ] **Step 1: Добавить тест на извлечение `messageId` из `t.me/c/...`**

```ts
it('extracts chat id and message id from t.me/c link for discussion mode', () => {
  ...
});
```

- [ ] **Step 2: Добавить тест на thread mode без messageId**

```ts
it('throws russian error when thread mode has no message id', async () => {
  ...
});
```

- [ ] **Step 3: Запустить tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/utils/normalize-telegram-identifier.util.spec.ts src/telegram/services/telegram-discussion-resolver.service.spec.ts`
Expected: FAIL.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts api/src/telegram/services/telegram-discussion-resolver.service.spec.ts
git commit -m "test: добавить резолв ссылок обсуждения telegram"
```

### Task 4: Реализовать discussion resolver

**Files:**
- Create: `api/src/telegram/services/telegram-discussion-resolver.service.ts`
- Modify: `api/src/telegram/utils/normalize-telegram-identifier.util.ts`
- Modify: `api/src/telegram/interfaces/telegram-client.interface.ts` if needed for richer normalized result

- [ ] **Step 1: Расширить normalizer для discussion use case**

Для `t.me/c/<chatId>/<messageId>` сохранить возможность извлекать `messageId`, а не только `chatId`.

- [ ] **Step 2: Реализовать discussion resolver**

Он должен:

- использовать существующий identifier resolver для chat entity;
- валидировать `mode`;
- для `thread` гарантировать наличие `messageId`.

- [ ] **Step 3: Запустить discussion resolver tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/services/telegram-discussion-resolver.service.spec.ts src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/services/telegram-discussion-resolver.service.ts api/src/telegram/utils/normalize-telegram-identifier.util.ts api/src/telegram/interfaces/telegram-client.interface.ts api/src/telegram/services/telegram-discussion-resolver.service.spec.ts api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts
git commit -m "feat: добавить resolver авторов обсуждения telegram"
```

## Chunk 3: Collector авторов комментариев

### Task 5: Написать failing tests для thread collector

**Files:**
- Create: `api/src/telegram/services/telegram-comment-author-collector.service.spec.ts`

- [ ] **Step 1: Добавить тест на сбор уникальных авторов из одного треда**

```ts
it('collects unique user authors from thread messages', async () => {
  ...
});
```

- [ ] **Step 2: Добавить тест на отбрасывание service messages**

```ts
it('ignores service messages and non-user senders', async () => {
  ...
});
```

- [ ] **Step 3: Запустить collector tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/services/telegram-comment-author-collector.service.spec.ts`
Expected: FAIL.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/services/telegram-comment-author-collector.service.spec.ts
git commit -m "test: добавить сбор авторов комментариев telegram"
```

### Task 6: Реализовать collector для `thread` и `chatRange`

**Files:**
- Create: `api/src/telegram/services/telegram-comment-author-collector.service.ts`

- [ ] **Step 1: Реализовать режим `thread`**

Минимальная логика:

- получить discussion messages по конкретному `messageId`;
- построить `usersMap`;
- извлечь авторов-пользователей;
- дедуплицировать по `telegramUserId`.

- [ ] **Step 2: Реализовать режим `chatRange`**

Минимальная логика:

- читать историю сообщений пакетами;
- ограничивать по `dateFrom/dateTo/messageLimit`;
- собирать уникальных авторов.

- [ ] **Step 3: Запустить collector tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/services/telegram-comment-author-collector.service.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/services/telegram-comment-author-collector.service.ts api/src/telegram/services/telegram-comment-author-collector.service.spec.ts
git commit -m "feat: добавить collector авторов комментариев telegram"
```

## Chunk 4: Orchestration и persistence

### Task 7: Написать failing service tests на discussion sync

**Files:**
- Modify: `api/src/telegram/telegram.service.spec.ts`

- [ ] **Step 1: Добавить тест на `thread` mode**

```ts
it('returns unique comment authors for thread mode', async () => {
  ...
});
```

- [ ] **Step 2: Добавить тест на `chatRange` mode**

```ts
it('returns unique comment authors for chat range mode', async () => {
  ...
});
```

- [ ] **Step 3: Запустить service tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/telegram.service.spec.ts`
Expected: FAIL.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/telegram.service.spec.ts
git commit -m "test: добавить orchestrator sync авторов обсуждения"
```

### Task 8: Собрать discussion orchestration

**Files:**
- Modify: `api/src/telegram/telegram.service.ts` or create dedicated orchestrator
- Modify: `api/src/telegram/telegram.module.ts`
- Optionally create: `api/src/telegram/services/telegram-discussion-sync.service.ts`

- [ ] **Step 1: Подключить discussion resolver и collector**

- [ ] **Step 2: Переиспользовать сохранение пользователей, где это возможно**

Если reuse текущего `chatSync.persistChat` делает модель слишком неясной, выделить отдельный `telegram-discussion-sync.service.ts`.

- [ ] **Step 3: Возвращать DTO с `mode` и `source = discussion_comments`**

- [ ] **Step 4: Запустить service tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/telegram.service.spec.ts src/telegram/services/telegram-discussion-resolver.service.spec.ts src/telegram/services/telegram-comment-author-collector.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram/telegram.service.ts api/src/telegram/telegram.module.ts api/src/telegram/services/telegram-discussion-sync.service.ts api/src/telegram/telegram.service.spec.ts
git commit -m "feat: добавить sync авторов обсуждения telegram"
```

## Chunk 5: Frontend режим `Комментаторы обсуждения`

### Task 9: Написать failing frontend tests на новый режим

**Files:**
- Modify: `front/src/modules/telegram/components/TelegramSyncCard.tsx`
- Modify/create tests near Telegram UI if they already exist

- [ ] **Step 1: Добавить тест на переключение режима**

Проверить отображение:

- `Участники`
- `Комментаторы обсуждения`

- [ ] **Step 2: Добавить тест на поля `thread/chatRange`**

Проверить:

- `messageId` для `thread`
- поля диапазона/лимита для `chatRange`

- [ ] **Step 3: Запустить frontend tests**

Run: `cd front && bun run test`
Expected: FAIL на отсутствии нового UI.

- [ ] **Step 4: Commit**

```bash
git add front/src/modules/telegram/components/TelegramSyncCard.tsx
git commit -m "test: добавить режим авторов обсуждения telegram"
```

### Task 10: Реализовать UI и API клиента

**Files:**
- Modify: `front/src/modules/telegram/api/telegram.api.ts`
- Modify: `front/src/modules/telegram/hooks/useTelegramSync.ts` or split into dedicated hook
- Modify: `front/src/modules/telegram/components/TelegramSyncCard.tsx`
- Create: `front/src/modules/telegram/types/telegramDiscussion.types.ts`

- [ ] **Step 1: Добавить типы discussion request/result**

- [ ] **Step 2: Добавить API вызов discussion sync**

- [ ] **Step 3: Реализовать переключение режима и условные поля**

- [ ] **Step 4: Показать helper text и ошибки на русском языке**

- [ ] **Step 5: Запустить frontend tests**

Run: `cd front && bun run test`
Expected: PASS или без новых Telegram-related падений.

- [ ] **Step 6: Commit**

```bash
git add front/src/modules/telegram/api/telegram.api.ts front/src/modules/telegram/hooks/useTelegramSync.ts front/src/modules/telegram/components/TelegramSyncCard.tsx front/src/modules/telegram/types/telegramDiscussion.types.ts
git commit -m "feat: добавить ui sync авторов обсуждения telegram"
```

## Chunk 6: Финальная проверка

### Task 11: Прогнать релевантные проверки

**Files:**
- Test: `api/src/telegram/**/*.spec.ts`
- Test: `front` telegram-related UI/tests

- [ ] **Step 1: Прогнать backend telegram tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/**/*.spec.ts`
Expected: PASS по Telegram-модулю.

- [ ] **Step 2: Прогнать frontend tests**

Run: `cd front && bun run test`
Expected: PASS или только уже существующие предупреждения без новых падений.

- [ ] **Step 3: Ручная проверка**

Проверить:

1. Один тред по `t.me/c/...` возвращает авторов комментариев.
2. `chatRange` возвращает авторов из диапазона.
3. Unknown internal ID показывает bootstrap-ошибку.
4. Обычный sync участников продолжает работать.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "test: проверить sync авторов обсуждения telegram"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-telegram-discussion-comment-authors.md`. Ready to execute?

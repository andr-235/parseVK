# Telegram Internal Identifiers Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Поддержать internal Telegram identifiers (`-100...` и `t.me/c/...`) как единый сценарий sync участников с честным bootstrap UX для первого импорта.

**Architecture:** Normalizer приводит `t.me/c/...` к тому же internal chat id flow, что и `-100...`. Resolver использует один unified path для internal identifiers: если metadata есть, открывает чат; если нет, возвращает actionable bootstrap error. Frontend показывает helper text и не маскирует этот сценарий generic ошибкой.

**Tech Stack:** NestJS, TypeScript, Vitest, React, hooks, UI helper text, backend error handling

---

## File Structure

### Modify

- `api/src/telegram/interfaces/telegram-client.interface.ts`
- `api/src/telegram/utils/normalize-telegram-identifier.util.ts`
- `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
- `api/src/telegram/services/telegram-identifier-resolver.service.ts`
- `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`
- `front/src/modules/telegram/hooks/useTelegramSync.ts`
- `front/src/modules/telegram/components/TelegramSyncCard.tsx`
- `front/src/shared/api/apiUtils.ts` (only if current error extraction masks backend message)

### Verify / related reads

- `api/src/telegram/telegram.service.ts`
- `front/src/modules/telegram/api/telegram.api.ts`

## Chunk 1: Unified internal identifier normalization

### Task 1: Написать failing tests для `t.me/c/...`

**Files:**
- Modify: `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
- Test: `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`

- [ ] **Step 1: Добавить тест на internal message link**

```ts
it('detects internal t.me/c link as channel numeric id', () => {
  expect(
    normalizeTelegramIdentifier('https://t.me/c/1949542659/115914'),
  ).toMatchObject({
    kind: 'channelNumericId',
    numericTelegramId: BigInt('1949542659'),
  });
});
```

- [ ] **Step 2: Запустить точечный тест**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
Expected: FAIL, потому что `t.me/c/...` сейчас invalid.

- [ ] **Step 3: Commit**

```bash
git add api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts
git commit -m "test: добавить t.me c ссылку в telegram normalizer"
```

### Task 2: Реализовать normalizer для `t.me/c/...`

**Files:**
- Modify: `api/src/telegram/utils/normalize-telegram-identifier.util.ts`
- Test: `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`

- [ ] **Step 1: Добавить паттерн internal message link**

Логика:

```ts
const internalMessageMatch = withoutPrefix.match(/^c\/(\d+)\/(\d+)$/);
```

- [ ] **Step 2: Нормализовать к internal channel id**

```ts
return {
  raw,
  normalized: `-100${chatId}`,
  kind: 'channelNumericId',
  numericTelegramId: BigInt(chatId),
};
```

`messageId` можно не сохранять в первой версии.

- [ ] **Step 3: Запустить normalizer tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/utils/normalize-telegram-identifier.util.ts api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts
git commit -m "feat: поддержать internal telegram ссылки"
```

## Chunk 2: Unified backend message for internal identifiers

### Task 3: Написать failing resolver tests на unified error

**Files:**
- Modify: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`
- Test: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`

- [ ] **Step 1: Добавить два сценария**

```ts
it('returns unified bootstrap error for unknown -100 id', async () => { ... });
it('returns unified bootstrap error for unknown t.me/c link', async () => { ... });
```

- [ ] **Step 2: Запустить resolver tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/services/telegram-identifier-resolver.service.spec.ts`
Expected: FAIL по тексту ошибки и/или новому кейсу `t.me/c/...`.

- [ ] **Step 3: Commit**

```bash
git add api/src/telegram/services/telegram-identifier-resolver.service.spec.ts
git commit -m "test: объединить ошибки internal telegram id"
```

### Task 4: Реализовать unified internal identifier error

**Files:**
- Modify: `api/src/telegram/services/telegram-identifier-resolver.service.ts`
- Test: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`

- [ ] **Step 1: Заменить current numeric-only message**

Пример:

```ts
throw new BadRequestException(
  'Cannot perform the first sync by internal Telegram ID only. Use @username, public link, or invite link first. After the first successful sync, internal IDs like -100... and t.me/c/... will work.',
);
```

- [ ] **Step 2: Оставить existing metadata path без изменения**

Не трогать:

- known `username` metadata
- known `accessHash` metadata

- [ ] **Step 3: Запустить resolver tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/services/telegram-identifier-resolver.service.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/services/telegram-identifier-resolver.service.ts api/src/telegram/services/telegram-identifier-resolver.service.spec.ts
git commit -m "fix: объединить bootstrap ошибку internal telegram id"
```

## Chunk 3: Frontend helper text and actionable error

### Task 5: Проверить текущий error propagation на фронте

**Files:**
- Read: `front/src/modules/telegram/hooks/useTelegramSync.ts`
- Read: `front/src/modules/telegram/api/telegram.api.ts`
- Read: `front/src/shared/api/apiUtils.ts`

- [ ] **Step 1: Убедиться, что backend message не теряется**

Если есть masking generic message, зафиксировать это как failing expectation.

- [ ] **Step 2: Определить минимальную точку правки**

Предпочтение:

- сначала hook/UI;
- трогать shared api utils только если сообщение реально не доходит.

- [ ] **Step 3: Commit**

```bash
git add front/src/modules/telegram/hooks/useTelegramSync.ts front/src/modules/telegram/api/telegram.api.ts front/src/shared/api/apiUtils.ts
git commit -m "test: проверить ошибки sync internal telegram id"
```

### Task 6: Показать helper text и unified instruction

**Files:**
- Modify: `front/src/modules/telegram/hooks/useTelegramSync.ts`
- Modify: `front/src/modules/telegram/components/TelegramSyncCard.tsx`
- Optionally modify: `front/src/shared/api/apiUtils.ts`

- [ ] **Step 1: Добавить helper text под полем identifier**

Пример:

```tsx
<p className="text-xs text-muted-foreground">
  Для первого импорта используйте @username, публичную или invite-ссылку.
  Internal ID и t.me/c/... работают для уже известных чатов.
</p>
```

- [ ] **Step 2: Не затирать backend message generic toast-ом**

Если backend message осмысленный, показывать именно его.

- [ ] **Step 3: Запустить frontend tests**

Run: `cd front && bun run test`
Expected: PASS, либо без новых падений от Telegram UI изменений.

- [ ] **Step 4: Commit**

```bash
git add front/src/modules/telegram/hooks/useTelegramSync.ts front/src/modules/telegram/components/TelegramSyncCard.tsx front/src/shared/api/apiUtils.ts
git commit -m "feat: подсказать bootstrap для internal telegram id"
```

## Chunk 4: Verification

### Task 7: Проверить backend и frontend вместе

**Files:**
- Test: `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
- Test: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`
- Test: `front` Telegram-related UX

- [ ] **Step 1: Прогнать backend Telegram unit tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/utils/normalize-telegram-identifier.util.spec.ts src/telegram/services/telegram-identifier-resolver.service.spec.ts`
Expected: PASS.

- [ ] **Step 2: Прогнать frontend relevant tests**

Run: `cd front && bun run test`
Expected: PASS или без новых Telegram-related падений.

- [ ] **Step 3: Ручная проверка сценариев**

Проверить:

1. `t.me/c/...` -> понятная bootstrap-инструкция
2. unknown `-100...` -> та же инструкция
3. known/public identifier path -> не сломан

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "test: проверить internal telegram identifiers"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-telegram-internal-identifiers.md`. Ready to execute?

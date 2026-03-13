# Telegram Numeric ID UX Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать понятным и actionable поведение Telegram sync для unknown numeric ID, не обещая невозможный first-resolve по голому `-100...`.

**Architecture:** Resolver-сервис сохраняет текущую стратегию numeric ID через saved metadata, но возвращает более точную доменную ошибку. Frontend перестаёт показывать этот кейс как общий сбой и даёт явную подсказку для первого импорта через `@username`, публичную или invite-ссылку.

**Tech Stack:** NestJS, TypeScript, Vitest, React, React hooks, toast/UI messaging

---

## File Structure

### Modify

- `api/src/telegram/services/telegram-identifier-resolver.service.ts`
- `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`
- `front/src/modules/telegram/hooks/useTelegramSync.ts`
- `front/src/modules/telegram/components/TelegramSyncCard.tsx`
- `front/src/shared/api/apiUtils.ts` (only if current error extraction blocks actionable backend messages)

### Verify / related reads

- `api/src/telegram/telegram.service.ts`
- `front/src/modules/telegram/api/telegram.api.ts`
- `front/src/shared/types/api.ts`

## Chunk 1: Backend error semantics

### Task 1: Написать failing backend test на actionable message

**Files:**
- Modify: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`
- Test: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`

- [ ] **Step 1: Добавить тест для unknown numeric ID**

```ts
it('returns actionable error for unknown numeric channel id', async () => {
  repository.findResolutionMetadataByTelegramId.mockResolvedValue(null);

  await expect(service.resolve(client, '-1001157519810')).rejects.toThrow(
    'Use @username, public link, or invite link for the first sync',
  );
});
```

- [ ] **Step 2: Запустить точечный тест**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/services/telegram-identifier-resolver.service.spec.ts`
Expected: FAIL по несовпадению текста ошибки.

- [ ] **Step 3: Commit**

```bash
git add api/src/telegram/services/telegram-identifier-resolver.service.spec.ts
git commit -m "test: уточнить ошибку для unknown numeric telegram id"
```

### Task 2: Обновить backend сообщение ошибки

**Files:**
- Modify: `api/src/telegram/services/telegram-identifier-resolver.service.ts`
- Test: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`

- [ ] **Step 1: Заменить generic message на actionable**

Пример:

```ts
throw new BadRequestException(
  'Cannot perform the first sync by numeric Telegram ID only. Use @username, public link, or invite link first.',
);
```

- [ ] **Step 2: Убедиться, что known numeric ID path не затронут**

Не менять ветки:

- metadata present + username
- metadata present + accessHash

- [ ] **Step 3: Запустить backend resolver tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/services/telegram-identifier-resolver.service.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/services/telegram-identifier-resolver.service.ts api/src/telegram/services/telegram-identifier-resolver.service.spec.ts
git commit -m "fix: сделать ошибку numeric telegram id понятной"
```

## Chunk 2: Frontend user guidance

### Task 3: Найти, как frontend сейчас показывает backend errors

**Files:**
- Read: `front/src/modules/telegram/hooks/useTelegramSync.ts`
- Read: `front/src/modules/telegram/api/telegram.api.ts`
- Read: `front/src/shared/api/apiUtils.ts`

- [ ] **Step 1: Проверить, доходит ли backend message до hook**

Нужно понять:

- пробрасывается ли `message` из response body;
- не затирается ли он generic toast-ом.

- [ ] **Step 2: Если message теряется, зафиксировать failing expectation**

Run: точечный existing frontend test или новый minimal test
Expected: FAIL, если hook/utility не сохраняет backend message.

- [ ] **Step 3: Commit**

```bash
git add front/src/modules/telegram/hooks/useTelegramSync.ts front/src/modules/telegram/api/telegram.api.ts front/src/shared/api/apiUtils.ts
git commit -m "test: зафиксировать обработку ошибки telegram sync"
```

### Task 4: Показать понятную инструкцию пользователю

**Files:**
- Modify: `front/src/modules/telegram/hooks/useTelegramSync.ts`
- Modify: `front/src/modules/telegram/components/TelegramSyncCard.tsx`
- Optionally modify: `front/src/shared/api/apiUtils.ts`

- [ ] **Step 1: Добавить helper text под полем identifier**

Пример текста:

```tsx
<p className="text-xs text-muted-foreground">
  Для первого импорта используйте @username, публичную или invite-ссылку.
  Numeric ID работает для уже известных чатов.
</p>
```

- [ ] **Step 2: Не затирать actionable backend error**

Если backend вернул доменное сообщение, показывать именно его.

- [ ] **Step 3: Свести generic toast к fallback**

Пример:

- есть осмысленная ошибка -> показываем её;
- нет message -> показываем общий fallback.

- [ ] **Step 4: Запустить frontend релевантные тесты**

Run: `cd front && bun run test`
Expected: PASS, либо точечный pass по Telegram-related tests если они есть.

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/telegram/hooks/useTelegramSync.ts front/src/modules/telegram/components/TelegramSyncCard.tsx front/src/shared/api/apiUtils.ts
git commit -m "feat: подсказать первый импорт telegram чата"
```

## Chunk 3: Verification

### Task 5: Проверить backend и frontend вместе

**Files:**
- Test: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`
- Test: `front` Telegram sync flow

- [ ] **Step 1: Прогнать backend resolver tests**

Run: `cd api && ./node_modules/.bin/vitest run src/telegram/services/telegram-identifier-resolver.service.spec.ts`
Expected: PASS.

- [ ] **Step 2: Прогнать frontend relevant tests**

Run: `cd front && bun run test`
Expected: PASS, либо зафиксированно без новых падений от Telegram-изменений.

- [ ] **Step 3: Ручная проверка текста**

Проверить сценарий:

- unknown `-100...` -> пользователь видит понятную инструкцию;
- known/public identifier path не ломается.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "test: проверить ux для numeric telegram id"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-telegram-numeric-id-ux.md`. Ready to execute?

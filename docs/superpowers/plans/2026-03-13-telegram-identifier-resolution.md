# Telegram Identifier Resolution Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Научить `POST /telegram/sync` автоматически распознавать все основные форматы Telegram-идентификаторов и корректно резолвить chat entity без падения на `CHANNEL_INVALID`.

**Architecture:** Добавляется отдельный `TelegramIdentifierResolverService`, который нормализует вход, определяет тип идентификатора и выбирает корректный сценарий получения `entity`. `TelegramService` остаётся orchestration-слоем, а `TelegramChat` начинает хранить `accessHash`, чтобы повторный sync по `-100...` работал через локальную metadata.

**Tech Stack:** NestJS, TypeScript, Vitest, Prisma, GramJS (`telegram`)

---

## File Structure

### Create

- `api/src/telegram/utils/normalize-telegram-identifier.util.ts`
- `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
- `api/src/telegram/services/telegram-identifier-resolver.service.ts`
- `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`
- `api/prisma/migrations/<timestamp>_add_access_hash_to_telegram_chat/migration.sql`

### Modify

- `api/prisma/schema.prisma`
- `api/src/telegram/telegram.module.ts`
- `api/src/telegram/telegram.service.ts`
- `api/src/telegram/telegram.service.spec.ts`
- `api/src/telegram/repositories/telegram-chat.repository.ts`
- `api/src/telegram/services/telegram-chat-sync.service.ts`
- `api/src/telegram/interfaces/telegram-client.interface.ts`
- `api/src/telegram/mappers/telegram-chat.mapper.ts`

### Verify / related reads

- `api/src/telegram/dto/sync-telegram-chat.dto.ts`
- `api/src/telegram/services/telegram-participant-collector.service.ts`
- `api/package.json`

## Chunk 1: Нормализация идентификатора

### Task 1: Добавить типы нормализованного идентификатора

**Files:**
- Modify: `api/src/telegram/interfaces/telegram-client.interface.ts`

- [ ] **Step 1: Просмотреть существующие Telegram types**

Run: `sed -n '1,240p' api/src/telegram/interfaces/telegram-client.interface.ts`
Expected: видны текущие интерфейсы `ResolvedChat`, `ParticipantCollection` и нет типов для raw identifier.

- [ ] **Step 2: Добавить типы для классификации identifier**

Добавить интерфейсы/типы уровня:

```ts
export type TelegramIdentifierKind =
  | 'username'
  | 'publicLink'
  | 'inviteLink'
  | 'numericId'
  | 'channelNumericId'
  | 'invalid';

export interface NormalizedTelegramIdentifier {
  raw: string;
  normalized: string;
  kind: TelegramIdentifierKind;
  numericTelegramId?: bigint;
  inviteHash?: string;
  username?: string;
}
```

- [ ] **Step 3: Проверить компиляцию типов**

Run: `cd api && npx tsc -p tsconfig.json --noEmit`
Expected: PASS без новых type errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/interfaces/telegram-client.interface.ts
git commit -m "feat: добавить типы идентификаторов telegram"
```

### Task 2: Написать failing tests для нормализации

**Files:**
- Create: `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
- Test: `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`

- [ ] **Step 1: Написать набор unit-тестов**

```ts
it('detects username with at-sign', () => {
  expect(normalizeTelegramIdentifier('@durov')).toMatchObject({
    kind: 'username',
    username: 'durov',
  });
});

it('detects public t.me link', () => {
  expect(normalizeTelegramIdentifier('https://t.me/durov')).toMatchObject({
    kind: 'publicLink',
    username: 'durov',
  });
});

it('detects invite link', () => {
  expect(normalizeTelegramIdentifier('https://t.me/+abc123')).toMatchObject({
    kind: 'inviteLink',
    inviteHash: 'abc123',
  });
});

it('detects -100 channel id', () => {
  expect(normalizeTelegramIdentifier('-1001157519810')).toMatchObject({
    kind: 'channelNumericId',
    numericTelegramId: BigInt('1157519810'),
  });
});

it('detects plain numeric id', () => {
  expect(normalizeTelegramIdentifier('123456789')).toMatchObject({
    kind: 'numericId',
    numericTelegramId: BigInt('123456789'),
  });
});

it('marks unsupported value as invalid', () => {
  expect(normalizeTelegramIdentifier('@@@')).toMatchObject({
    kind: 'invalid',
  });
});
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `cd api && npx vitest run api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
Expected: FAIL, потому что util ещё не существует.

- [ ] **Step 3: Commit**

```bash
git add api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts
git commit -m "test: добавить тесты нормализации telegram идентификатора"
```

### Task 3: Реализовать util нормализации

**Files:**
- Create: `api/src/telegram/utils/normalize-telegram-identifier.util.ts`
- Test: `api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts`

- [ ] **Step 1: Реализовать минимальный util**

```ts
const T_ME_PREFIX = /^(https?:\/\/)?t\.me\//i;
const INVITE_PREFIX = /^(?:\+|joinchat\/)/i;

export function normalizeTelegramIdentifier(
  raw: string,
): NormalizedTelegramIdentifier {
  const value = raw.trim();

  if (!value) {
    return { raw, normalized: '', kind: 'invalid' };
  }

  if (/^-100\d+$/.test(value)) {
    return {
      raw,
      normalized: value,
      kind: 'channelNumericId',
      numericTelegramId: BigInt(value.slice(4)),
    };
  }

  if (/^\d+$/.test(value)) {
    return {
      raw,
      normalized: value,
      kind: 'numericId',
      numericTelegramId: BigInt(value),
    };
  }

  // username/publicLink/inviteLink branches...
}
```

- [ ] **Step 2: Запустить unit-тесты**

Run: `cd api && npx vitest run src/telegram/utils/normalize-telegram-identifier.util.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add api/src/telegram/utils/normalize-telegram-identifier.util.ts api/src/telegram/utils/normalize-telegram-identifier.util.spec.ts api/src/telegram/interfaces/telegram-client.interface.ts
git commit -m "feat: добавить нормализацию telegram идентификаторов"
```

## Chunk 2: Resolver-сервис

### Task 4: Написать failing tests для resolver-а

**Files:**
- Create: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`
- Test: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`

- [ ] **Step 1: Подготовить mocks и сценарии**

Покрыть минимум:

```ts
it('resolves username via client.getEntity', async () => { ... });
it('resolves public link via client.getEntity', async () => { ... });
it('resolves known channel numeric id from repository metadata', async () => { ... });
it('throws BadRequestException for unknown numeric channel id', async () => { ... });
it('throws BadRequestException for invalid format', async () => { ... });
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `cd api && npx vitest run src/telegram/services/telegram-identifier-resolver.service.spec.ts`
Expected: FAIL, потому что сервис ещё не создан.

- [ ] **Step 3: Commit**

```bash
git add api/src/telegram/services/telegram-identifier-resolver.service.spec.ts
git commit -m "test: добавить тесты резолвера telegram идентификаторов"
```

### Task 5: Расширить репозиторий chat metadata

**Files:**
- Modify: `api/src/telegram/repositories/telegram-chat.repository.ts`
- Test: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`

- [ ] **Step 1: Добавить поле `accessHash` в repository DTO**

Добавить в create/update data:

```ts
accessHash: string | null;
```

- [ ] **Step 2: Добавить helper для lightweight lookup**

Добавить метод уровня:

```ts
findResolutionMetadataByTelegramId(telegramId: bigint) {
  return this.prisma.telegramChat.findUnique({
    where: { telegramId },
    select: {
      id: true,
      telegramId: true,
      type: true,
      username: true,
      accessHash: true,
    },
  });
}
```

- [ ] **Step 3: Запустить type-check**

Run: `cd api && npx tsc -p tsconfig.json --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add api/src/telegram/repositories/telegram-chat.repository.ts
git commit -m "feat: расширить репозиторий telegram чатов metadata"
```

### Task 6: Реализовать resolver-сервис

**Files:**
- Create: `api/src/telegram/services/telegram-identifier-resolver.service.ts`
- Modify: `api/src/telegram/telegram.module.ts`
- Test: `api/src/telegram/services/telegram-identifier-resolver.service.spec.ts`

- [ ] **Step 1: Создать сервис и внедрить зависимости**

Сервис должен использовать:

- util нормализации;
- `TelegramChatRepository`;
- GramJS `Api`;
- `BadRequestException`.

- [ ] **Step 2: Реализовать username/public link resolution**

Минимальный код:

```ts
if (normalized.kind === 'username' || normalized.kind === 'publicLink') {
  return {
    identifier: normalized,
    entity: await client.getEntity(normalized.username ?? normalized.normalized),
  };
}
```

- [ ] **Step 3: Реализовать numeric id resolution через БД**

Если `kind === 'channelNumericId'`:

- читать metadata из `TelegramChatRepository`;
- если `accessHash` отсутствует, бросать `BadRequestException`;
- если metadata есть, строить `new Api.InputChannel({...})`;
- запрашивать канал через `new Api.channels.GetChannels({ id: [inputChannel] })`;
- вернуть первый `Api.Channel`.

Если `kind === 'numericId'`:

- сначала пробовать metadata из БД;
- если ничего нет, отдавать контролируемую ошибку.

- [ ] **Step 4: Реализовать invite handling первой версии**

Первая версия:

- корректно распознаёт invite hash;
- не делает silent auto-join;
- возвращает предсказуемую ошибку вида `Invite links require explicit join flow`.

Это лучше, чем оставлять invite format нераспознанным.

- [ ] **Step 5: Зарегистрировать сервис в модуле**

Добавить `TelegramIdentifierResolverService` в `providers` и export только если он нужен вне модуля.

- [ ] **Step 6: Запустить resolver unit tests**

Run: `cd api && npx vitest run src/telegram/services/telegram-identifier-resolver.service.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/src/telegram/services/telegram-identifier-resolver.service.ts api/src/telegram/services/telegram-identifier-resolver.service.spec.ts api/src/telegram/telegram.module.ts api/src/telegram/repositories/telegram-chat.repository.ts
git commit -m "feat: добавить резолвер telegram идентификаторов"
```

## Chunk 3: Сохранение `accessHash` у чатов

### Task 7: Добавить поле в Prisma schema и миграцию

**Files:**
- Modify: `api/prisma/schema.prisma`
- Create: `api/prisma/migrations/<timestamp>_add_access_hash_to_telegram_chat/migration.sql`

- [ ] **Step 1: Написать schema change**

В `model TelegramChat` добавить:

```prisma
accessHash String?
```

- [ ] **Step 2: Сгенерировать миграцию**

Run: `cd api && npx prisma migrate dev --name add_access_hash_to_telegram_chat`
Expected: создан новый каталог миграции и обновлён schema state.

- [ ] **Step 3: Проверить SQL миграции**

Expected SQL:

```sql
ALTER TABLE "TelegramChat" ADD COLUMN "accessHash" TEXT;
```

- [ ] **Step 4: Regenerate Prisma client if needed**

Run: `cd api && npx prisma generate`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/prisma/schema.prisma api/prisma/migrations api/src/generated/prisma
git commit -m "chore: добавить access hash для telegram чатов"
```

### Task 8: Сохранять `accessHash` при sync

**Files:**
- Modify: `api/src/telegram/mappers/telegram-chat.mapper.ts`
- Modify: `api/src/telegram/services/telegram-chat-sync.service.ts`
- Modify: `api/src/telegram/repositories/telegram-chat.repository.ts`

- [ ] **Step 1: Расширить `ResolvedChat` данными для `accessHash`**

Добавить поле:

```ts
accessHash: string | null;
```

- [ ] **Step 2: Обновить mapper**

Для `Api.Channel`:

```ts
accessHash: entity.accessHash ? entity.accessHash.toString() : null,
```

Для `Api.Chat` и `Api.User`:

```ts
accessHash: null,
```

- [ ] **Step 3: Обновить persist flow**

В `TelegramChatSyncService.persistChat()` включить `accessHash` в `create` и `update`.

- [ ] **Step 4: Запустить связанные тесты**

Run: `cd api && npx vitest run src/telegram/mappers/telegram-chat.mapper.spec.ts src/telegram/telegram.service.spec.ts`
Expected: PASS или точечные фиксы тестов.

- [ ] **Step 5: Commit**

```bash
git add api/src/telegram/mappers/telegram-chat.mapper.ts api/src/telegram/services/telegram-chat-sync.service.ts api/src/telegram/repositories/telegram-chat.repository.ts api/src/telegram/interfaces/telegram-client.interface.ts
git commit -m "feat: сохранять access hash telegram чата"
```

## Chunk 4: Интеграция в `TelegramService`

### Task 9: Переписать `syncChat` на resolver

**Files:**
- Modify: `api/src/telegram/telegram.service.ts`
- Modify: `api/src/telegram/telegram.service.spec.ts`

- [ ] **Step 1: Обновить constructor dependencies**

Внедрить `TelegramIdentifierResolverService`.

- [ ] **Step 2: Убрать прямой вызов `client.getEntity(identifier)`**

Заменить на:

```ts
const resolution = await this.identifierResolver.resolve(client, identifier);
const resolved = this.chatMapper.resolveChat(resolution.entity);
```

- [ ] **Step 3: Уточнить пользовательские ошибки**

Сохранять технический stack в логах, но отдавать `BadRequestException` с понятным текстом по типу failure.

- [ ] **Step 4: Обновить unit tests сервиса**

Покрыть минимум:

- пустой identifier;
- успешный путь через resolver;
- ошибка resolver-а;
- ошибка participant collector.

- [ ] **Step 5: Запустить сервисные тесты**

Run: `cd api && npx vitest run src/telegram/telegram.service.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add api/src/telegram/telegram.service.ts api/src/telegram/telegram.service.spec.ts
git commit -m "feat: перевести sync telegram на универсальный резолвер"
```

## Chunk 5: Верификация

### Task 10: Прогнать целевые тесты Telegram-модуля

**Files:**
- Test: `api/src/telegram/**/*.spec.ts`

- [ ] **Step 1: Запустить релевантный набор unit-тестов**

Run: `cd api && npx vitest run src/telegram/**/*.spec.ts`
Expected: PASS.

- [ ] **Step 2: Запустить type-check**

Run: `cd api && npx tsc -p tsconfig.json --noEmit`
Expected: PASS.

- [ ] **Step 3: Если есть e2e для API, прогнать их точечно**

Run: `cd api && npx vitest run --config vitest.e2e.config.ts`
Expected: PASS или документированное отсутствие релевантных e2e.

- [ ] **Step 4: Зафиксировать итог**

Подготовить краткую сводку:

- какие форматы работают;
- какие ошибки стали контролируемыми;
- какие ограничения остались у invite flow.

- [ ] **Step 5: Commit**

```bash
git add api
git commit -m "test: проверить универсальный резолв telegram идентификаторов"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-telegram-identifier-resolution.md`. Ready to execute?

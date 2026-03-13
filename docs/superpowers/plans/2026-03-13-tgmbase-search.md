# TGMB Search Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить production-страницу массового поиска по `tgmbase` с отдельным Prisma-клиентом, сводной таблицей результатов и детальными карточками групп, контактов и сообщений.

**Architecture:** Решение разделяется на два независимых слоя: backend-модуль `tgmbase-search` в NestJS и frontend-модуль страницы поиска в Vite/React. Для новой БД используется отдельный Prisma schema и отдельный generated client, чтобы не смешивать типы и datasource текущей базы `vk_api`.

**Tech Stack:** NestJS, Prisma, PostgreSQL, React 19, React Router, TanStack Query, Vitest, Testing Library

---

## File Structure

### Backend

- Create: `api/prisma/tgmbase.prisma`
- Modify: `api/package.json`
- Create: `api/scripts/generate-tgmbase-client.mjs`
- Create: `api/src/tgmbase-prisma/tgmbase-prisma.service.ts`
- Create: `api/src/tgmbase-prisma/tgmbase-prisma.module.ts`
- Create: `api/src/tgmbase-search/tgmbase-search.module.ts`
- Create: `api/src/tgmbase-search/tgmbase-search.controller.ts`
- Create: `api/src/tgmbase-search/tgmbase-search.service.ts`
- Create: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`
- Create: `api/src/tgmbase-search/dto/tgmbase-search-request.dto.ts`
- Create: `api/src/tgmbase-search/dto/tgmbase-search-response.dto.ts`
- Create: `api/src/tgmbase-search/utils/normalize-tgmbase-query.util.ts`
- Create: `api/src/tgmbase-search/utils/normalize-tgmbase-query.util.spec.ts`
- Create: `api/src/tgmbase-search/mappers/tgmbase-search.mapper.ts`
- Modify: `api/src/app.module.ts`
- Modify: `api/.env.example`

### Frontend

- Modify: `front/src/App.tsx`
- Modify: `front/src/shared/components/Sidebar/constants.ts`
- Create: `front/src/pages/TgmbaseSearch.tsx`
- Create: `front/src/modules/tgmbase-search/index.ts`
- Create: `front/src/modules/tgmbase-search/api/queryKeys.ts`
- Create: `front/src/modules/tgmbase-search/api/tgmbaseSearch.api.ts`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseSearchHero.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseSearchForm.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseSummaryTable.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultCard.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseMessagesPanel.tsx`
- Create: `front/src/modules/tgmbase-search/hooks/useTgmbaseSearch.ts`
- Create: `front/src/modules/tgmbase-search/hooks/useTgmbaseSearchState.ts`
- Create: `front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
- Modify: `front/src/shared/types/api.ts`

### Docs

- Modify: `docs/superpowers/specs/2026-03-13-tgmbase-search-design.md` only if schema details from real DB force spec clarification

## Chunk 1: Prisma and backend skeleton

### Task 1: Add second Prisma schema for `tgmbase`

**Files:**
- Create: `api/prisma/tgmbase.prisma`
- Modify: `api/package.json`
- Create: `api/scripts/generate-tgmbase-client.mjs`
- Modify: `api/.env.example`

- [ ] **Step 1: Write the failing generation command into the plan target files**

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/tgmbase"
}

datasource db {
  provider = "postgresql"
  url      = env("TGMBASE_DATABASE_URL")
}
```

- [ ] **Step 2: Add generation script before any implementation logic**

```json
{
  "scripts": {
    "prisma:generate:tgmbase": "prisma generate --schema prisma/tgmbase.prisma && node scripts/generate-tgmbase-client.mjs"
  }
}
```

- [ ] **Step 3: Add environment variable template**

```dotenv
TGMBASE_DATABASE_URL=postgresql://readonly:readonly@localhost:5432/tgmbase
```

- [ ] **Step 4: Run client generation**

Run: `npm run prisma:generate:tgmbase`
Expected: Prisma creates client in `api/src/generated/tgmbase` without touching the existing `vk_api` client

- [ ] **Step 5: Commit**

```bash
git add api/prisma/tgmbase.prisma api/package.json api/scripts/generate-tgmbase-client.mjs api/.env.example api/src/generated/tgmbase
git commit -m "chore: добавить prisma клиент для tgmbase"
```

### Task 2: Register `tgmbase` Prisma service in NestJS

**Files:**
- Create: `api/src/tgmbase-prisma/tgmbase-prisma.service.ts`
- Create: `api/src/tgmbase-prisma/tgmbase-prisma.module.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Write a failing unit smoke test or compile target expectation**

```ts
import { TgmbasePrismaService } from './tgmbase-prisma.service.js';

describe('TgmbasePrismaService', () => {
  it('creates the tgmbase prisma client', () => {
    expect(TgmbasePrismaService).toBeDefined();
  });
});
```

- [ ] **Step 2: Implement the service with isolated client lifecycle**

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/tgmbase/client.js';

@Injectable()
export class TgmbasePrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 3: Export the module for feature consumers**

```ts
import { Global, Module } from '@nestjs/common';
import { TgmbasePrismaService } from './tgmbase-prisma.service.js';

@Global()
@Module({
  providers: [TgmbasePrismaService],
  exports: [TgmbasePrismaService],
})
export class TgmbasePrismaModule {}
```

- [ ] **Step 4: Register the module in `AppModule`**

Run: `npm run typecheck`
Expected: `AppModule` compiles with the new import and no unresolved module errors

- [ ] **Step 5: Commit**

```bash
git add api/src/tgmbase-prisma api/src/app.module.ts
git commit -m "feat: подключить tgmbase prisma service"
```

## Chunk 2: Search domain and API contract

### Task 3: Define request normalization and statuses using TDD

**Files:**
- Create: `api/src/tgmbase-search/utils/normalize-tgmbase-query.util.ts`
- Create: `api/src/tgmbase-search/utils/normalize-tgmbase-query.util.spec.ts`

- [ ] **Step 1: Write failing tests for normalization**

```ts
import { describe, expect, it } from 'vitest';
import { normalizeTgmbaseQuery } from './normalize-tgmbase-query.util.js';

describe('normalizeTgmbaseQuery', () => {
  it('detects telegramId', () => {
    expect(normalizeTgmbaseQuery('123456789')).toMatchObject({
      queryType: 'telegramId',
      normalizedValue: '123456789',
    });
  });

  it('detects username', () => {
    expect(normalizeTgmbaseQuery('@sample_user')).toMatchObject({
      queryType: 'username',
      normalizedValue: 'sample_user',
    });
  });

  it('detects phoneNumber', () => {
    expect(normalizeTgmbaseQuery('+79991234567')).toMatchObject({
      queryType: 'phoneNumber',
    });
  });

  it('marks unsupported input as invalid', () => {
    expect(normalizeTgmbaseQuery('')).toMatchObject({ queryType: 'invalid' });
  });
});
```

- [ ] **Step 2: Run the targeted test**

Run: `npm run test -- src/tgmbase-search/utils/normalize-tgmbase-query.util.spec.ts`
Expected: FAIL because utility does not exist yet

- [ ] **Step 3: Implement the minimal normalizer**

```ts
export type TgmbaseQueryType = 'telegramId' | 'username' | 'phoneNumber' | 'invalid';

export const normalizeTgmbaseQuery = (rawValue: string) => {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { rawValue, normalizedValue: '', queryType: 'invalid' as const };
  }

  if (/^\d+$/.test(trimmed)) {
    return { rawValue, normalizedValue: trimmed, queryType: 'telegramId' as const };
  }

  if (/^@?[a-zA-Z0-9_]{5,}$/.test(trimmed)) {
    return {
      rawValue,
      normalizedValue: trimmed.replace(/^@/, ''),
      queryType: 'username' as const,
    };
  }

  const digitsOnly = trimmed.replace(/[^\d+]/g, '');
  if (/^\+?\d{10,15}$/.test(digitsOnly)) {
    return { rawValue, normalizedValue: digitsOnly, queryType: 'phoneNumber' as const };
  }

  return { rawValue, normalizedValue: trimmed, queryType: 'invalid' as const };
};
```

- [ ] **Step 4: Re-run the test**

Run: `npm run test -- src/tgmbase-search/utils/normalize-tgmbase-query.util.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/tgmbase-search/utils
git commit -m "test: добавить нормализацию запросов tgmbase"
```

### Task 4: Build search DTOs, service skeleton, and controller

**Files:**
- Create: `api/src/tgmbase-search/dto/tgmbase-search-request.dto.ts`
- Create: `api/src/tgmbase-search/dto/tgmbase-search-response.dto.ts`
- Create: `api/src/tgmbase-search/mappers/tgmbase-search.mapper.ts`
- Create: `api/src/tgmbase-search/tgmbase-search.service.ts`
- Create: `api/src/tgmbase-search/tgmbase-search.controller.ts`
- Create: `api/src/tgmbase-search/tgmbase-search.module.ts`
- Create: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`
- Modify: `api/src/app.module.ts`

- [ ] **Step 1: Write the failing service test for batch behavior**

```ts
import { describe, expect, it, vi } from 'vitest';
import { TgmbaseSearchService } from './tgmbase-search.service.js';

describe('TgmbaseSearchService', () => {
  it('returns per-query results without failing the whole batch', async () => {
    const prisma = {
      $transaction: vi.fn(),
    } as never;

    const service = new TgmbaseSearchService(prisma);
    const result = await service.search({ queries: ['123', '@user'] });

    expect(result.items).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Implement request DTO with hard limits**

```ts
export class TgmbaseSearchRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsString({ each: true })
  queries!: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
```

- [ ] **Step 3: Implement minimal controller and module**

```ts
@Controller('tgmbase')
export class TgmbaseSearchController {
  constructor(private readonly service: TgmbaseSearchService) {}

  @Post('search')
  search(@Body() payload: TgmbaseSearchRequestDto) {
    return this.service.search(payload);
  }
}
```

- [ ] **Step 4: Implement service returning contract-shaped stubbed results, then swap in Prisma queries**

Run: `npm run test -- src/tgmbase-search/tgmbase-search.service.spec.ts`
Expected: PASS with real DTO shape and per-item statuses

- [ ] **Step 5: Commit**

```bash
git add api/src/tgmbase-search api/src/app.module.ts
git commit -m "feat: добавить api поиска по tgmbase"
```

### Task 5: Implement Prisma-backed search queries for profile, groups, contacts, and messages

**Files:**
- Modify: `api/src/tgmbase-search/tgmbase-search.service.ts`
- Modify: `api/src/tgmbase-search/tgmbase-search.service.spec.ts`
- Modify: `api/prisma/tgmbase.prisma` if introspection reveals naming mismatches

- [ ] **Step 1: Inspect real `tgmbase` tables and map them into Prisma models**

Run: `npx prisma db pull --schema prisma/tgmbase.prisma`
Expected: schema reflects the actual tables for users, groups/chats, memberships, and messages

- [ ] **Step 2: Add targeted tests for ambiguous and not found scenarios**

```ts
it('returns ambiguous when multiple users match one phone number', async () => {
  // mock prisma user lookup returning multiple rows
});

it('returns not_found when user lookup is empty', async () => {
  // mock prisma user lookup returning []
});
```

- [ ] **Step 3: Implement query pipeline**

```ts
const profile = await this.findProfile(normalizedQuery);
const groups = await this.findGroups(profile.id);
const contacts = await this.findContacts(profile.id);
const messagesPage = await this.findMessages({
  profileId: profile.id,
  page: payload.page ?? 1,
  pageSize: payload.pageSize ?? 20,
});
```

- [ ] **Step 4: Run focused backend verification**

Run: `npm run test -- src/tgmbase-search`
Expected: PASS for unit tests covering normalization and batch search behavior

- [ ] **Step 5: Commit**

```bash
git add api/prisma/tgmbase.prisma api/src/tgmbase-search
git commit -m "feat: реализовать выборки tgmbase для профилей и сообщений"
```

## Chunk 3: Frontend page and user flow

### Task 6: Add route, sidebar entry, and API client

**Files:**
- Modify: `front/src/App.tsx`
- Modify: `front/src/shared/components/Sidebar/constants.ts`
- Create: `front/src/pages/TgmbaseSearch.tsx`
- Create: `front/src/modules/tgmbase-search/index.ts`
- Create: `front/src/modules/tgmbase-search/api/queryKeys.ts`
- Create: `front/src/modules/tgmbase-search/api/tgmbaseSearch.api.ts`
- Modify: `front/src/shared/types/api.ts`

- [ ] **Step 1: Define shared API types**

```ts
export interface TgmbaseSearchItem {
  query: string;
  queryType: 'telegramId' | 'username' | 'phoneNumber' | 'invalid';
  status: 'found' | 'not_found' | 'ambiguous' | 'invalid' | 'error';
  stats: {
    groups: number;
    contacts: number;
    messages: number;
  };
}
```

- [ ] **Step 2: Add the API function**

```ts
export const searchTgmbase = (payload: TgmbaseSearchRequest) =>
  apiClient.post<TgmbaseSearchResponse>('/tgmbase/search', payload);
```

- [ ] **Step 3: Register the page and navigation entry**

```tsx
const TgmbaseSearch = lazy(() => import('@/pages/TgmbaseSearch'));
<Route path="/tgmbase-search" element={<TgmbaseSearch />} />
```

- [ ] **Step 4: Verify build-level typing**

Run: `npm run build`
Expected: front compiles with the new route and shared types

- [ ] **Step 5: Commit**

```bash
git add front/src/App.tsx front/src/shared/components/Sidebar/constants.ts front/src/pages/TgmbaseSearch.tsx front/src/modules/tgmbase-search front/src/shared/types/api.ts
git commit -m "feat: добавить маршрут и api клиента для поиска tgmbase"
```

### Task 7: Build the search page with summary table and result cards

**Files:**
- Create: `front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseSearchHero.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseSearchForm.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseSummaryTable.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultCard.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseMessagesPanel.tsx`
- Create: `front/src/modules/tgmbase-search/hooks/useTgmbaseSearch.ts`
- Create: `front/src/modules/tgmbase-search/hooks/useTgmbaseSearchState.ts`

- [ ] **Step 1: Write the failing page test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TgmbaseSearchPage } from '../components/TgmbaseSearchPage';

it('submits multiple queries and renders summary rows', async () => {
  render(<TgmbaseSearchPage />);
  await userEvent.type(screen.getByLabelText(/список/i), '123{enter}@demo');
  await userEvent.click(screen.getByRole('button', { name: /найти/i }));
  expect(await screen.findByText('123')).toBeInTheDocument();
  expect(await screen.findByText('@demo')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the targeted frontend test**

Run: `npm run test -- TgmbaseSearchPage`
Expected: FAIL because page and hooks do not exist yet

- [ ] **Step 3: Implement the page composition**

```tsx
export function TgmbaseSearchPage() {
  const vm = useTgmbaseSearchState();

  return (
    <div className="space-y-6">
      <TgmbaseSearchHero />
      <TgmbaseSearchForm value={vm.input} onChange={vm.setInput} onSubmit={vm.submit} />
      <TgmbaseSummaryTable items={vm.result?.items ?? []} onSelect={vm.selectQuery} />
      {vm.result?.items.map((item) => (
        <TgmbaseResultCard key={item.query} item={item} selected={vm.selectedQuery === item.query} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Implement messages panel with lazy pagination UI**

Run: `npm run test -- TgmbaseSearchPage`
Expected: PASS with summary rows and detail cards rendered from mocked response

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tgmbase-search
git commit -m "feat: собрать страницу поиска по tgmbase"
```

### Task 8: Polish UX states and edge cases

**Files:**
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSearchForm.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSummaryTable.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseResultCard.tsx`
- Modify: `front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`

- [ ] **Step 1: Add failing tests for `invalid`, `not_found`, and `ambiguous`**

```tsx
it('renders ambiguous state with candidate hint', async () => {
  // mock ambiguous result and assert badge text
});
```

- [ ] **Step 2: Implement UX for error and empty states**

```tsx
if (item.status === 'not_found') {
  return <EmptyState title="Совпадения не найдены" />;
}
```

- [ ] **Step 3: Add scroll-to-card behavior from summary table**

```tsx
onClick={() => document.getElementById(`tgmbase-result-${item.query}`)?.scrollIntoView({ behavior: 'smooth' })}
```

- [ ] **Step 4: Re-run page tests**

Run: `npm run test -- TgmbaseSearchPage`
Expected: PASS with all major states covered

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tgmbase-search
git commit -m "test: покрыть состояния страницы поиска tgmbase"
```

## Chunk 4: Verification and release readiness

### Task 9: Run targeted verification

**Files:**
- No code changes required unless failures expose defects

- [ ] **Step 1: Run backend tests**

Run: `cd api && npm run test -- src/tgmbase-search`
Expected: PASS

- [ ] **Step 2: Run backend typecheck**

Run: `cd api && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Run frontend tests**

Run: `cd front && npm run test -- TgmbaseSearchPage`
Expected: PASS

- [ ] **Step 4: Run frontend build**

Run: `cd front && npm run build`
Expected: PASS

- [ ] **Step 5: Commit final fixes if verification required changes**

```bash
git add api front
git commit -m "fix: довести поиск tgmbase до production готовности"
```

### Task 10: Manual QA checklist

**Files:**
- No code changes required

- [ ] **Step 1: Verify auth-protected route**

Run: open `/tgmbase-search` in an authenticated session
Expected: page opens only for authorized users

- [ ] **Step 2: Verify batch search**

Run: submit one `telegramId`, one `@username`, one `phoneNumber`
Expected: summary table shows three rows with correct statuses

- [ ] **Step 3: Verify detail navigation**

Run: click a summary row
Expected: the matching detail card scrolls into view

- [ ] **Step 4: Verify messages pagination**

Run: open a result with many messages and request next page
Expected: additional messages load without clearing previous context

- [ ] **Step 5: Record release notes**

```bash
git log --oneline -- api/src/tgmbase-search front/src/modules/tgmbase-search api/prisma/tgmbase.prisma
```

Expected: concise list of commits that map to schema, API, UI, and verification work

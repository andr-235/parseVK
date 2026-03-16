# VK Comments Elasticsearch Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить для страницы комментариев ВК отдельный Elasticsearch-based режим поиска по русскому тексту комментариев и постов с fuzzy/словоформами, сохранив текущую keyword-based выборку как fallback.

**Architecture:** PostgreSQL остаётся source of truth для комментариев, постов и keyword-matches. Elasticsearch добавляется как search read-model с одним документом на комментарий, отдельным backend-модулем поиска и near-real-time синхронизацией через сервис индексирования с retry/reindex контуром.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Elasticsearch, React, Vite, Vitest/Jest

---

## Chunk 1: Search Foundation

### Task 1: Зафиксировать backend-модуль и контракт поиска

**Files:**
- Create: `api/src/comments-search/comments-search.module.ts`
- Create: `api/src/comments-search/comments-search.controller.ts`
- Create: `api/src/comments-search/comments-search.service.ts`
- Create: `api/src/comments-search/comments-search.service.spec.ts`
- Create: `api/src/comments-search/dto/comments-search-request.dto.ts`
- Create: `api/src/comments-search/dto/comments-search-response.dto.ts`
- Create: `api/src/comments-search/types/comments-search.types.ts`
- Modify: `api/src/app.module.ts`
- Reference: `docs/superpowers/specs/2026-03-16-vk-comments-elasticsearch-design.md`

- [ ] **Step 1: Write the failing service spec for the search contract**

```ts
describe('CommentsSearchService', () => {
  it('returns comment-mode payload with total and highlights', async () => {
    const result = await service.search({
      query: 'ремонт квартиры',
      viewMode: 'comments',
      page: 1,
      pageSize: 20,
      keywords: [],
      readStatus: 'all',
    });

    expect(result.viewMode).toBe('comments');
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      type: 'comment',
      commentId: 101,
      highlight: expect.any(Array),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/comments-search.service.spec.ts`
Expected: FAIL because module/service files do not exist

- [ ] **Step 3: Create request/response DTOs and service skeleton**

```ts
export class CommentsSearchRequestDto {
  query!: string;
  viewMode!: 'comments' | 'posts';
  page = 1;
  pageSize = 20;
  keywords?: string[];
  keywordSource?: 'COMMENT' | 'POST';
  readStatus?: 'all' | 'read' | 'unread';
}
```

```ts
@Injectable()
export class CommentsSearchService {
  async search(payload: CommentsSearchRequestDto): Promise<CommentsSearchResponseDto> {
    return {
      source: 'elasticsearch',
      viewMode: payload.viewMode,
      total: 0,
      page: payload.page ?? 1,
      pageSize: payload.pageSize ?? 20,
      items: [],
    };
  }
}
```

- [ ] **Step 4: Add controller and register module**

```ts
@Controller('comments')
export class CommentsSearchController {
  constructor(private readonly service: CommentsSearchService) {}

  @Post('search')
  search(@Body() payload: CommentsSearchRequestDto) {
    return this.service.search(payload);
  }
}
```

- [ ] **Step 5: Run backend contract tests**

Run: `npm --prefix api test -- src/comments-search/comments-search.service.spec.ts src/comments/comments.controller.spec.ts`
Expected: PASS for new search service contract and no regressions in existing comments controller tests

- [ ] **Step 6: Commit**

```bash
git add api/src/comments-search api/src/app.module.ts
git commit -m "feat: добавлен каркас поиска комментариев через elasticsearch"
```

### Task 2: Добавить Elasticsearch client и search index config

**Files:**
- Create: `api/src/comments-search/comments-search.client.ts`
- Create: `api/src/comments-search/comments-search.config.ts`
- Create: `api/src/comments-search/comments-search.client.spec.ts`
- Modify: `api/package.json`
- Modify: `api/.env.example`

- [ ] **Step 1: Write the failing client spec**

```ts
it('builds index name and exposes search/index methods', () => {
  const client = new CommentsSearchClient(config);
  expect(client.indexName).toBe('vk-comments');
  expect(typeof client.search).toBe('function');
  expect(typeof client.indexDocument).toBe('function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/comments-search.client.spec.ts`
Expected: FAIL because search client/config are missing

- [ ] **Step 3: Add minimal config and client wrapper**

```ts
export interface CommentsSearchConfig {
  node: string;
  indexName: string;
  username?: string;
  password?: string;
}
```

```ts
export class CommentsSearchClient {
  readonly indexName: string;

  async search(params: SearchRequest) {
    return this.client.search({ index: this.indexName, ...params });
  }

  async indexDocument(id: string, document: CommentsSearchDocument) {
    return this.client.index({ index: this.indexName, id, document, refresh: 'wait_for' });
  }
}
```

- [ ] **Step 4: Add env vars and dependency**

Add to `api/.env.example`:

```env
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=vk-comments
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
COMMENTS_SEARCH_ENABLED=false
```

- [ ] **Step 5: Run targeted tests**

Run: `npm --prefix api test -- src/comments-search/comments-search.client.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/comments-search api/package.json api/.env.example
git commit -m "chore: добавлена конфигурация клиента elasticsearch"
```

### Task 3: Описать mapping и русскоязычный анализатор индекса

**Files:**
- Create: `api/src/comments-search/index/comments-search-index.schema.ts`
- Create: `api/src/comments-search/index/comments-search-index.schema.spec.ts`
- Create: `api/src/comments-search/index/comments-search-index-admin.service.ts`

- [ ] **Step 1: Write the failing mapping spec**

```ts
it('creates mapping with separate commentText and postText fields', () => {
  const schema = buildCommentsSearchIndexSchema();
  expect(schema.mappings.properties.commentText).toBeDefined();
  expect(schema.mappings.properties.postText).toBeDefined();
  expect(schema.settings.analysis).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/index/comments-search-index.schema.spec.ts`
Expected: FAIL because schema builder is missing

- [ ] **Step 3: Implement schema builder**

```ts
export function buildCommentsSearchIndexSchema() {
  return {
    settings: {
      analysis: {
        analyzer: {
          ru_text: {
            tokenizer: 'standard',
            filter: ['lowercase', 'russian_morphology', 'russian_stop'],
          },
        },
      },
    },
    mappings: {
      properties: {
        commentText: { type: 'text', analyzer: 'ru_text' },
        postText: { type: 'text', analyzer: 'ru_text' },
        keywordWords: { type: 'keyword' },
        publishedAt: { type: 'date' },
      },
    },
  };
}
```

- [ ] **Step 4: Add index admin service**

```ts
async ensureIndex() {
  const exists = await this.client.indexExists();
  if (!exists) {
    await this.client.createIndex(buildCommentsSearchIndexSchema());
  }
}
```

- [ ] **Step 5: Run schema tests**

Run: `npm --prefix api test -- src/comments-search/index/comments-search-index.schema.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/comments-search/index
git commit -m "feat: добавлен mapping индекса комментариев"
```

## Chunk 2: Indexing Pipeline

### Task 4: Построить документ индекса из Comment/Post/Author/Group

**Files:**
- Create: `api/src/comments-search/mappers/comments-search-document.mapper.ts`
- Create: `api/src/comments-search/mappers/comments-search-document.mapper.spec.ts`
- Reference: `api/src/comments/repositories/comments.repository.ts`
- Reference: `api/src/comments/mappers/comment.mapper.ts`

- [ ] **Step 1: Write the failing mapper spec**

```ts
it('maps comment entity to search document with post context', () => {
  const document = mapper.map(commentFixture);
  expect(document).toMatchObject({
    commentId: 101,
    postId: 55,
    commentText: 'Нужен ремонт квартиры',
    postText: 'Ищем подрядчика для ремонта',
    keywordWords: ['ремонт'],
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/mappers/comments-search-document.mapper.spec.ts`
Expected: FAIL because mapper file is missing

- [ ] **Step 3: Implement minimal mapper**

```ts
return {
  commentId: comment.id,
  postId: comment.postId,
  ownerId: comment.ownerId,
  vkCommentId: comment.vkCommentId,
  authorVkId: comment.authorVkId,
  groupId: comment.post.group?.vkId ?? null,
  publishedAt: comment.publishedAt.toISOString(),
  source: comment.source,
  isRead: comment.isRead,
  commentText: comment.text,
  postText: comment.post.text,
  keywordWords: comment.commentKeywordMatches.map((item) => item.keyword.word),
  authorName: [comment.author?.firstName, comment.author?.lastName].filter(Boolean).join(' '),
  groupName: comment.post.group?.name ?? null,
};
```

- [ ] **Step 4: Run mapper tests**

Run: `npm --prefix api test -- src/comments-search/mappers/comments-search-document.mapper.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/comments-search/mappers
git commit -m "feat: добавлен маппер документов индекса комментариев"
```

### Task 5: Добавить repository для загрузки комментария с полным контекстом под индексирование

**Files:**
- Create: `api/src/comments-search/repositories/comments-search-index.repository.ts`
- Create: `api/src/comments-search/repositories/comments-search-index.repository.spec.ts`
- Modify: `api/src/comments/interfaces/comments-repository.interface.ts` only if shared type extraction is needed

- [ ] **Step 1: Write the failing repository spec**

```ts
it('loads comment with post, group, author and keyword matches', async () => {
  const entity = await repository.findByCommentId(101);
  expect(entity?.post?.group?.name).toBe('Тестовая группа');
  expect(entity?.commentKeywordMatches[0].keyword.word).toBe('ремонт');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/repositories/comments-search-index.repository.spec.ts`
Expected: FAIL because repository file is missing

- [ ] **Step 3: Implement repository with focused include graph**

```ts
return this.prisma.comment.findUnique({
  where: { id: commentId },
  include: {
    author: { select: authorSelect },
    commentKeywordMatches: { include: { keyword: { select: keywordSelect } } },
    post: {
      select: {
        text: true,
        group: { select: { vkId: true, name: true, screenName: true } },
      },
    },
  },
});
```

- [ ] **Step 4: Run repository tests**

Run: `npm --prefix api test -- src/comments-search/repositories/comments-search-index.repository.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/comments-search/repositories
git commit -m "feat: добавлен repository для индексирования комментариев"
```

### Task 6: Встроить near-real-time индексирование в сохранение комментариев

**Files:**
- Modify: `api/src/common/services/comments-saver.service.ts`
- Create: `api/src/comments-search/services/comments-search-indexer.service.ts`
- Create: `api/src/comments-search/services/comments-search-indexer.service.spec.ts`
- Modify: `api/src/common/services/comments-saver.service.spec.ts`

- [ ] **Step 1: Write the failing indexer spec**

```ts
it('indexes saved comment after successful upsert', async () => {
  await saver.saveComments([comment], { source: CommentSource.TASK });
  expect(indexer.indexCommentById).toHaveBeenCalledWith(101);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/common/services/comments-saver.service.spec.ts`
Expected: FAIL because saver does not notify search indexer

- [ ] **Step 3: Inject indexer and call it after successful save**

```ts
const savedComment = await this.prisma.comment.upsert(...);
await this.syncCommentKeywordMatches(...);
await this.syncPostKeywordMatches(...);
await this.searchIndexer.scheduleIndexComment(savedComment.id);
```

- [ ] **Step 4: Implement minimal indexer service**

```ts
async scheduleIndexComment(commentId: number) {
  if (!this.config.enabled) return;
  await this.indexCommentById(commentId);
}
```

- [ ] **Step 5: Run targeted tests**

Run: `npm --prefix api test -- src/common/services/comments-saver.service.spec.ts src/comments-search/services/comments-search-indexer.service.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/common/services/comments-saver.service.ts api/src/common/services/comments-saver.service.spec.ts api/src/comments-search/services
git commit -m "feat: добавлена синхронизация комментариев с индексом поиска"
```

### Task 7: Добавить retry/outbox и bulk reindex контур

**Files:**
- Create: `api/src/comments-search/services/comments-search-reindex.service.ts`
- Create: `api/src/comments-search/services/comments-search-reindex.service.spec.ts`
- Create: `api/src/comments-search/types/comments-search-outbox.type.ts`
- Modify: `api/prisma/schema.prisma` only if persistent outbox table is selected
- Create: `api/prisma/migrations/<timestamp>_add_comments_search_outbox/migration.sql` only if persistent outbox table is selected

- [ ] **Step 1: Write the failing reindex spec**

```ts
it('retries failed indexing and exposes bulk reindex by comment ids', async () => {
  await service.reindexComments([101, 102]);
  expect(client.indexDocument).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/services/comments-search-reindex.service.spec.ts`
Expected: FAIL because reindex service is missing

- [ ] **Step 3: Implement in-memory or DB-backed retry abstraction**

```ts
export interface PendingIndexJob {
  entityType: 'comment' | 'post';
  entityId: number;
  attempts: number;
}
```

Choose one:
- DB-backed outbox if reliability across restarts is required immediately
- in-memory retry only if this plan is explicitly being split into MVP and hardening phases

- [ ] **Step 4: Implement bulk reindex**

```ts
async reindexComments(commentIds: number[]) {
  for (const commentId of commentIds) {
    await this.indexer.indexCommentById(commentId);
  }
}
```

- [ ] **Step 5: Run tests**

Run: `npm --prefix api test -- src/comments-search/services/comments-search-reindex.service.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/comments-search api/prisma/schema.prisma api/prisma/migrations
git commit -m "feat: добавлен контур переиндексации поиска комментариев"
```

## Chunk 3: Query Execution

### Task 8: Реализовать query builder для comment-mode поиска

**Files:**
- Create: `api/src/comments-search/builders/comments-search-query.builder.ts`
- Create: `api/src/comments-search/builders/comments-search-query.builder.spec.ts`
- Reference: `api/src/comments/builders/comments-filter.builder.ts`

- [ ] **Step 1: Write the failing query-builder spec**

```ts
it('builds comment-mode query with boosted commentText and filtered keywordWords', () => {
  const query = builder.build({
    query: 'ремонт кухни',
    viewMode: 'comments',
    keywords: ['ремонт'],
    readStatus: 'unread',
  });

  expect(query.query.bool.must).toBeDefined();
  expect(JSON.stringify(query)).toContain('commentText');
  expect(JSON.stringify(query)).toContain('postText');
  expect(JSON.stringify(query)).toContain('keywordWords');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/builders/comments-search-query.builder.spec.ts`
Expected: FAIL because builder is missing

- [ ] **Step 3: Implement minimal query builder**

```ts
multi_match: {
  query: payload.query,
  fields: ['commentText^4', 'postText^1.5'],
  fuzziness: 'AUTO',
  operator: 'and',
}
```

Add filters for:
- `keywordWords`
- `isRead`
- date range if introduced in DTO

- [ ] **Step 4: Run query-builder tests**

Run: `npm --prefix api test -- src/comments-search/builders/comments-search-query.builder.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/comments-search/builders
git commit -m "feat: добавлен query builder для поиска комментариев"
```

### Task 9: Реализовать post-mode группировку и DTO mapping

**Files:**
- Create: `api/src/comments-search/mappers/comments-search-response.mapper.ts`
- Create: `api/src/comments-search/mappers/comments-search-response.mapper.spec.ts`
- Modify: `api/src/comments-search/comments-search.service.ts`
- Modify: `api/src/comments-search/comments-search.service.spec.ts`

- [ ] **Step 1: Write the failing post-mode spec**

```ts
it('returns grouped post results when viewMode=posts', async () => {
  const result = await service.search({
    query: 'ремонт',
    viewMode: 'posts',
    page: 1,
    pageSize: 10,
  });

  expect(result.viewMode).toBe('posts');
  expect(result.items[0]).toMatchObject({
    type: 'post',
    postId: 55,
    comments: expect.any(Array),
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/comments-search.service.spec.ts`
Expected: FAIL because post-mode mapping is not implemented

- [ ] **Step 3: Implement response mapper for both modes**

```ts
if (payload.viewMode === 'posts') {
  return this.mapper.toPostGroups(searchResult);
}

return this.mapper.toCommentItems(searchResult);
```

- [ ] **Step 4: Run service tests**

Run: `npm --prefix api test -- src/comments-search/comments-search.service.spec.ts src/comments-search/mappers/comments-search-response.mapper.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/comments-search
git commit -m "feat: добавлены режимы выдачи комментариев и постов"
```

### Task 10: Добавить fallback и feature flag

**Files:**
- Modify: `api/src/comments-search/comments-search.service.ts`
- Create: `api/src/comments-search/services/comments-search-fallback.service.ts`
- Create: `api/src/comments-search/services/comments-search-fallback.service.spec.ts`
- Modify: `api/.env.example`

- [ ] **Step 1: Write the failing fallback spec**

```ts
it('returns fallback metadata when elasticsearch is disabled', async () => {
  const result = await service.search(payload);
  expect(result.source).toBe('fallback');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/services/comments-search-fallback.service.spec.ts`
Expected: FAIL because fallback service is missing

- [ ] **Step 3: Implement fallback service**

```ts
if (!this.config.enabled) {
  return this.fallback.search(payload);
}
```

Fallback may:
- call existing comments query path with keyword filters only; or
- return controlled “search unavailable” response if free-text query cannot be represented correctly

- [ ] **Step 4: Run tests**

Run: `npm --prefix api test -- src/comments-search/comments-search.service.spec.ts src/comments-search/services/comments-search-fallback.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/comments-search api/.env.example
git commit -m "feat: добавлен fallback для поиска комментариев"
```

## Chunk 4: Frontend Integration

### Task 11: Расширить API и client-side модели комментариев

**Files:**
- Create: `front/src/modules/comments/api/dto/commentsSearch.dto.ts`
- Create: `front/src/modules/comments/api/mappers/mapCommentsSearchResult.ts`
- Modify: `front/src/modules/comments/api/comments.api.ts`
- Modify: `front/src/modules/comments/api/models/comment.model.ts`
- Create: `front/src/modules/comments/api/query/buildCommentsSearchQuery.ts`
- Create: `front/src/modules/comments/hooks/__tests__/useCommentsSearchQuery.test.ts`
- Create: `front/src/modules/comments/hooks/useCommentsSearchQuery.ts`

- [ ] **Step 1: Write the failing query hook test**

```tsx
it('calls /comments/search with viewMode and query', async () => {
  renderHook(() => useCommentsSearchQuery({ query: 'ремонт', viewMode: 'comments' }));
  expect(commentsApi.search).toHaveBeenCalledWith(
    expect.objectContaining({ query: 'ремонт', viewMode: 'comments' }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix front test -- --run front/src/modules/comments/hooks/__tests__/useCommentsSearchQuery.test.ts`
Expected: FAIL because search hook/API are missing

- [ ] **Step 3: Implement API client and mapper**

```ts
search(payload: CommentsSearchRequest) {
  return apiClient.post<CommentsSearchResponse>('/comments/search', payload);
}
```

- [ ] **Step 4: Run front API tests**

Run: `npm --prefix front test -- --run front/src/modules/comments/hooks/__tests__/useCommentsSearchQuery.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/comments/api front/src/modules/comments/hooks
git commit -m "feat: добавлен frontend клиент поиска комментариев"
```

### Task 12: Добавить состояние search-mode и переключатель `Комментарии / Посты`

**Files:**
- Modify: `front/src/modules/comments/store/commentsStore.ts`
- Modify: `front/src/modules/comments/hooks/useCommentsViewModel.ts`
- Modify: `front/src/modules/comments/components/CommentsFiltersPanel.tsx`
- Create: `front/src/modules/comments/components/__tests__/CommentsFiltersPanel.searchMode.test.tsx`

- [ ] **Step 1: Write the failing UI test**

```tsx
it('switches view mode from comments to posts', async () => {
  render(<CommentsFiltersPanel {...props} />);
  await user.click(screen.getByRole('button', { name: /посты/i }));
  expect(props.onViewModeChange).toHaveBeenCalledWith('posts');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix front test -- --run front/src/modules/comments/components/__tests__/CommentsFiltersPanel.searchMode.test.tsx`
Expected: FAIL because view mode toggle is missing

- [ ] **Step 3: Add view-mode state and props**

```ts
type CommentsSearchViewMode = 'comments' | 'posts';
```

Expose from view model:

```ts
viewMode,
handleViewModeChange,
isFuzzySearchEnabled,
```

- [ ] **Step 4: Render toggle in filters panel**

```tsx
<SegmentedToggle
  value={viewMode}
  options={[{ value: 'comments', label: 'Комментарии' }, { value: 'posts', label: 'Посты' }]}
  onChange={onViewModeChange}
/>
```

- [ ] **Step 5: Run UI tests**

Run: `npm --prefix front test -- --run front/src/modules/comments/components/__tests__/CommentsFiltersPanel.searchMode.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add front/src/modules/comments/store front/src/modules/comments/hooks/useCommentsViewModel.ts front/src/modules/comments/components/CommentsFiltersPanel.tsx front/src/modules/comments/components/__tests__/CommentsFiltersPanel.searchMode.test.tsx
git commit -m "feat: добавлен переключатель режимов поиска комментариев"
```

### Task 13: Подключить search results в страницу комментариев

**Files:**
- Modify: `front/src/modules/comments/components/CommentsPage.tsx`
- Modify: `front/src/modules/comments/components/CommentsTableCard.tsx`
- Modify: `front/src/modules/comments/components/PostGroupCard.tsx`
- Create: `front/src/modules/comments/components/SearchCommentCard.tsx`
- Create: `front/src/modules/comments/components/__tests__/CommentsPage.search.test.tsx`

- [ ] **Step 1: Write the failing page integration test**

```tsx
it('renders comment search results by default and grouped post results in posts mode', async () => {
  render(<CommentsPage />);
  expect(await screen.findByText(/Нужен ремонт квартиры/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /посты/i }));
  expect(await screen.findByText(/Ищем подрядчика/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix front test -- --run front/src/modules/comments/components/__tests__/CommentsPage.search.test.tsx`
Expected: FAIL because page still renders only legacy grouped comments data

- [ ] **Step 3: Integrate new result renderer**

Rules:
- default mode renders comment hits
- posts mode renders grouped post cards
- legacy keyword-based table remains available when search mode is disabled/fallback

- [ ] **Step 4: Run page tests**

Run: `npm --prefix front test -- --run front/src/modules/comments/components/__tests__/CommentsPage.search.test.tsx front/src/modules/comments/components/__tests__/CommentsTableCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/comments/components front/src/modules/comments/hooks/useCommentsViewModel.ts
git commit -m "feat: подключена поисковая выдача на странице комментариев"
```

## Chunk 5: Rollout, Observability, Verification

### Task 14: Добавить metrics, logs и health checks поискового слоя

**Files:**
- Create: `api/src/comments-search/comments-search.health.ts`
- Create: `api/src/comments-search/comments-search.metrics.ts`
- Modify: `api/src/comments-search/comments-search.service.ts`
- Modify: `api/src/monitoring` only if project already exposes shared health/metrics endpoints for feature modules

- [ ] **Step 1: Write the failing observability spec**

```ts
it('records source and latency for search requests', async () => {
  await service.search(payload);
  expect(metrics.recordSearch).toHaveBeenCalledWith(
    expect.objectContaining({ source: 'elasticsearch' }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix api test -- src/comments-search/comments-search.service.spec.ts`
Expected: FAIL because metrics hooks are absent

- [ ] **Step 3: Add lightweight metrics/logging hooks**

Track:
- request duration
- result count
- source: `elasticsearch` or `fallback`
- indexing failures
- reindex queue size if persistent outbox is used

- [ ] **Step 4: Run tests**

Run: `npm --prefix api test -- src/comments-search/comments-search.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/comments-search api/src/monitoring
git commit -m "chore: добавлена наблюдаемость поиска комментариев"
```

### Task 15: Провести итоговую верификацию backend

**Files:**
- Test: `api/src/comments-search/**/*.spec.ts`
- Test: `api/src/common/services/comments-saver.service.spec.ts`
- Test: `api/src/comments/**/*.spec.ts`

- [ ] **Step 1: Run focused backend suite**

Run: `npm --prefix api test -- src/comments-search src/common/services/comments-saver.service.spec.ts src/comments`
Expected: PASS for search, indexing, saver, and existing comments specs

- [ ] **Step 2: Run lint/type checks relevant to backend**

Run: `npm --prefix api run lint`
Expected: PASS or only known unrelated warnings

- [ ] **Step 3: Commit verification-only changes if any fixtures were updated**

```bash
git add api
git commit -m "test: обновлена backend верификация поиска комментариев"
```

### Task 16: Провести итоговую верификацию frontend

**Files:**
- Test: `front/src/modules/comments/**/*.test.tsx`
- Test: `front/src/modules/comments/**/*.test.ts`

- [ ] **Step 1: Run focused frontend suite**

Run: `npm --prefix front test -- --run front/src/modules/comments`
Expected: PASS for new search-mode tests and existing comments page tests

- [ ] **Step 2: Run frontend lint/type checks**

Run: `npm --prefix front run lint`
Expected: PASS

- [ ] **Step 3: Commit verification-only changes if snapshots/fixtures changed**

```bash
git add front
git commit -m "test: подтверждена frontend интеграция поиска комментариев"
```

### Task 17: Обновить документацию запуска и rollout notes

**Files:**
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/DEPLOYMENT_RUNBOOK.md`
- Modify: `docs/superpowers/specs/2026-03-16-vk-comments-elasticsearch-design.md` only if implementation clarified operational details
- Create: `docs/superpowers/audits/2026-03-16-vk-comments-elasticsearch-rollout.md`

- [ ] **Step 1: Write rollout note**

Document:
- required env vars
- how to create index
- how to run bulk reindex
- how to disable feature flag and revert to fallback

- [ ] **Step 2: Run quick docs sanity check**

Run: `rg -n "ELASTICSEARCH_|COMMENTS_SEARCH_ENABLED|comments/search|reindex" docs api/.env.example`
Expected: matching operational references exist

- [ ] **Step 3: Commit docs**

```bash
git add docs api/.env.example
git commit -m "docs: описан rollout поиска комментариев через elasticsearch"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-16-vk-comments-elasticsearch.md`. Ready to execute?

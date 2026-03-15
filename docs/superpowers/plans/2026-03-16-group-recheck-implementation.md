# Group Recheck Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить режим задачи `Перепроверить группу`, который проходит по всем доступным через VK API постам выбранных групп и сохраняет комментарии в БД без очистки существующих данных.

**Architecture:** Расширяем существующий pipeline задач новым полем `mode`, не меняя CQRS и очередь принципиально. Новый режим использует тот же pipeline сохранения постов, комментариев и авторов, но меняет только стратегию получения списка постов: вместо последних `N` постов выполняется постраничный обход стены группы.

**Tech Stack:** NestJS, CQRS, BullMQ, Prisma, vk-io, React, Zustand, Vitest

---

## File Map

### Backend contracts and task metadata

- Modify: `api/src/tasks/dto/create-parsing-task.dto.ts`
- Modify: `api/src/tasks/commands/impl/create-parsing-task.command.ts`
- Modify: `api/src/tasks/commands/impl/execute-parsing-task.command.ts`
- Modify: `api/src/tasks/commands/impl/process-group.command.ts`
- Modify: `api/src/tasks/interfaces/parsing-task-job.interface.ts`
- Modify: `api/src/tasks/interfaces/task.interface.ts`
- Modify: `api/src/tasks/commands/handlers/create-parsing-task.handler.ts`
- Modify: `api/src/tasks/commands/handlers/execute-parsing-task.handler.ts`
- Modify: `api/src/tasks/queues/parsing.processor.ts`
- Modify: `api/src/tasks/parsers/task-description.parser.ts`
- Modify: `api/src/tasks/services/task-group-resolver.service.ts`
- Modify: `api/src/tasks/mappers/task.mapper.ts`

### Backend VK post retrieval

- Modify: `api/src/vk/vk.service.ts`
- Modify: `api/src/vk/services/vk-posts.service.ts`
- Modify: `api/src/tasks/commands/handlers/process-group.handler.ts`

### Backend tests

- Modify: `api/src/tasks/tasks.controller.spec.ts`
- Modify: `api/src/tasks/parsers/task-description.parser.spec.ts`
- Modify: `api/src/vk/vk.service.spec.ts`
- Modify: `api/src/vk/services/vk-posts.service.spec.ts`
- Modify: `api/src/tasks/commands/handlers/process-group.handler.spec.ts` or create if missing
- Modify: `api/src/tasks/commands/handlers/create-parsing-task.handler.spec.ts` or create if missing

### Frontend request/response contracts and state

- Modify: `front/src/shared/types/dto/create-parsing-task.dto.ts`
- Modify: `front/src/shared/types/api.ts`
- Modify: `front/src/shared/types/common.ts`
- Modify: `front/src/modules/tasks/api/tasks.api.ts`
- Modify: `front/src/modules/tasks/store/tasksStore.ts`
- Modify: `front/src/modules/tasks/store/tasksStore.mappers/extractors/extractTaskData.ts`
- Modify: `front/src/modules/tasks/store/tasksStore.mappers/mappers/mapSummaryToTask.ts`
- Modify: `front/src/modules/tasks/store/tasksStore.mappers/mappers/mapResultToTaskDetails.ts`
- Modify: `front/src/modules/tasks/hooks/useTasksSocket.ts`

### Frontend UI

- Modify: `front/src/modules/tasks/components/CreateParseTaskModal.tsx`
- Modify: `front/src/modules/tasks/hooks/useCreateParseTaskModal.ts`
- Modify: `front/src/modules/tasks/components/TasksPage.tsx`
- Modify: `front/src/modules/tasks/config/taskTableColumns.tsx`
- Modify: `front/src/modules/tasks/components/TaskDetails/hooks/useTaskStats.ts`
- Modify: `front/src/modules/tasks/components/TaskDetails/components/TaskStatsGrid.tsx`

### Frontend tests

- Create or modify: `front/src/modules/tasks/components/__tests__/CreateParseTaskModal.test.tsx`
- Modify: `front/src/modules/tasks/store/tasksStore.mappers/mappers/mapSummaryToTask.spec.ts` or create if missing
- Modify: `front/src/modules/tasks/store/tasksStore.mappers/mappers/mapResultToTaskDetails.spec.ts` or create if missing

## Chunk 1: Backend contract and metadata

### Task 1: Add failing DTO and parser tests for `mode`

**Files:**
- Modify: `api/src/tasks/parsers/task-description.parser.spec.ts`
- Modify: `api/src/tasks/tasks.controller.spec.ts`

- [ ] **Step 1: Write the failing parser test for the new field**

```ts
it('parses recheck mode from task description', () => {
  const parsed = parser.parse({
    description: JSON.stringify({
      scope: 'selected',
      groupIds: [1, 2],
      mode: 'recheck_group',
      postLimit: null,
    }),
  } as TaskRecord);

  expect(parsed.mode).toBe('recheck_group');
  expect(parsed.postLimit).toBeNull();
});
```

- [ ] **Step 2: Write the failing controller/handler contract test**

```ts
await controller.createParsingTask({
  scope: ParsingScope.SELECTED,
  groupIds: [1],
  mode: ParsingTaskMode.RECHECK_GROUP,
});

expect(commandBus.execute).toHaveBeenCalledWith(
  expect.objectContaining({
    mode: ParsingTaskMode.RECHECK_GROUP,
  }),
);
```

- [ ] **Step 3: Run the targeted tests and confirm failure**

Run: `npm --prefix api test -- --run api/src/tasks/parsers/task-description.parser.spec.ts api/src/tasks/tasks.controller.spec.ts`

Expected: FAIL because `mode` does not exist in DTO/parser/command contract.

- [ ] **Step 4: Implement the minimal contract changes**

Add a shared enum in `api/src/tasks/dto/create-parsing-task.dto.ts`:

```ts
export enum ParsingTaskMode {
  RECENT_POSTS = 'recent_posts',
  RECHECK_GROUP = 'recheck_group',
}
```

Thread `mode` through:

- `CreateParsingTaskDto`
- `CreateParsingTaskCommand`
- `ExecuteParsingTaskCommand`
- `ProcessGroupCommand`
- `ParsingTaskJobData`

- [ ] **Step 5: Extend parsing and mapping**

Update `api/src/tasks/parsers/task-description.parser.ts` to:

- parse `mode`
- stringify `mode`
- default missing legacy descriptions to `recent_posts`

Update `api/src/tasks/interfaces/task.interface.ts` and `api/src/tasks/mappers/task.mapper.ts` so API responses include `mode`.

- [ ] **Step 6: Run the targeted tests and confirm pass**

Run: `npm --prefix api test -- --run api/src/tasks/parsers/task-description.parser.spec.ts api/src/tasks/tasks.controller.spec.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add api/src/tasks/dto/create-parsing-task.dto.ts api/src/tasks/commands/impl/create-parsing-task.command.ts api/src/tasks/commands/impl/execute-parsing-task.command.ts api/src/tasks/commands/impl/process-group.command.ts api/src/tasks/interfaces/parsing-task-job.interface.ts api/src/tasks/interfaces/task.interface.ts api/src/tasks/parsers/task-description.parser.ts api/src/tasks/parsers/task-description.parser.spec.ts api/src/tasks/tasks.controller.spec.ts api/src/tasks/mappers/task.mapper.ts
git commit -m "feat: добавлен режим задач перепроверки групп"
```

### Task 2: Thread `mode` through task creation and task titles

**Files:**
- Modify: `api/src/tasks/commands/handlers/create-parsing-task.handler.ts`
- Modify: `api/src/tasks/services/task-group-resolver.service.ts`
- Modify: `api/src/tasks/queues/parsing.processor.ts`
- Modify: `api/src/tasks/commands/handlers/execute-parsing-task.handler.ts`
- Modify: `api/src/tasks/commands/handlers/create-parsing-task.handler.spec.ts` or create

- [ ] **Step 1: Write a failing handler test for recheck task creation**

```ts
expect(repository.create).toHaveBeenCalledWith(
  expect.objectContaining({
    title: 'Перепроверка группы: Test group',
    description: JSON.stringify({
      scope: ParsingScope.SELECTED,
      groupIds: [1],
      mode: ParsingTaskMode.RECHECK_GROUP,
      postLimit: null,
    }),
  }),
);
```

- [ ] **Step 2: Run the handler test and confirm failure**

Run: `npm --prefix api test -- --run api/src/tasks/commands/handlers/create-parsing-task.handler.spec.ts`

Expected: FAIL because title/description/queue payload still assume only `postLimit`.

- [ ] **Step 3: Implement creation flow updates**

In `CreateParsingTaskHandler`:

- default `mode` to `recent_posts`
- set `postLimit = 10` only for `recent_posts`
- set `postLimit = null` for `recheck_group`
- enqueue `mode` with the job payload

In `TaskGroupResolverService`:

- add mode-aware title builder

In `ParsingProcessor` and `ExecuteParsingTaskHandler`:

- accept and log `mode`
- pass `mode` to `ProcessGroupCommand`

- [ ] **Step 4: Run the handler test and related task tests**

Run: `npm --prefix api test -- --run api/src/tasks/commands/handlers/create-parsing-task.handler.spec.ts api/src/tasks/tasks.controller.spec.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/tasks/commands/handlers/create-parsing-task.handler.ts api/src/tasks/services/task-group-resolver.service.ts api/src/tasks/queues/parsing.processor.ts api/src/tasks/commands/handlers/execute-parsing-task.handler.ts api/src/tasks/commands/handlers/create-parsing-task.handler.spec.ts
git commit -m "feat: протянут режим перепроверки через создание задач"
```

## Chunk 2: Backend post retrieval strategy

### Task 3: Add failing VK posts service tests for paginated full scan

**Files:**
- Modify: `api/src/vk/services/vk-posts.service.spec.ts`
- Modify: `api/src/vk/vk.service.spec.ts`

- [ ] **Step 1: Write the failing pagination test**

```ts
it('iterates through all group posts page by page', async () => {
  api.wall.get
    .mockResolvedValueOnce({ items: [{ id: 1 }, { id: 2 }] })
    .mockResolvedValueOnce({ items: [{ id: 3 }] })
    .mockResolvedValueOnce({ items: [] });

  const batches = [];
  for await (const batch of service.iterateGroupPosts({ ownerId: -1, count: 2 })) {
    batches.push(batch.map((post) => post.id));
  }

  expect(batches).toEqual([[1, 2], [3]]);
});
```

- [ ] **Step 2: Run the VK posts tests and confirm failure**

Run: `npm --prefix api test -- --run api/src/vk/services/vk-posts.service.spec.ts api/src/vk/vk.service.spec.ts`

Expected: FAIL because iterator/full-scan API does not exist.

- [ ] **Step 3: Implement minimal full-scan API**

In `api/src/vk/services/vk-posts.service.ts` add one focused method:

```ts
async *iterateGroupPosts(options: {
  ownerId: number;
  batchSize?: number;
}): AsyncGenerator<IPost[], void, void>
```

Behavior:

- call `wall.get` with `offset`
- normalize posts exactly like `getGroupRecentPosts`
- yield non-empty batches
- stop on empty page or short page

Expose this from `api/src/vk/vk.service.ts`.

- [ ] **Step 4: Run VK post service tests**

Run: `npm --prefix api test -- --run api/src/vk/services/vk-posts.service.spec.ts api/src/vk/vk.service.spec.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/vk/services/vk-posts.service.ts api/src/vk/services/vk-posts.service.spec.ts api/src/vk/vk.service.ts api/src/vk/vk.service.spec.ts
git commit -m "feat: добавлен постраничный обход постов группы"
```

### Task 4: Switch `ProcessGroupHandler` by mode without changing save pipeline

**Files:**
- Modify: `api/src/tasks/commands/handlers/process-group.handler.ts`
- Modify: `api/src/tasks/commands/handlers/process-group.handler.spec.ts` or create

- [ ] **Step 1: Write failing process-group tests**

Add two tests:

```ts
it('uses recent post fetch for recent_posts mode', async () => {
  await handler.execute(
    new ProcessGroupCommand(group, ParsingTaskMode.RECENT_POSTS, 10, context, 1),
  );

  expect(vkService.getGroupRecentPosts).toHaveBeenCalledWith({
    ownerId: -group.vkId,
    count: 10,
  });
});

it('uses full-scan iterator for recheck_group mode', async () => {
  vkService.iterateGroupPosts = vi.fn().mockReturnValue(makeAsyncBatches([[post1], [post2]]));

  await handler.execute(
    new ProcessGroupCommand(group, ParsingTaskMode.RECHECK_GROUP, null, context, 1),
  );

  expect(vkService.iterateGroupPosts).toHaveBeenCalledWith({
    ownerId: -group.vkId,
  });
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `npm --prefix api test -- --run api/src/tasks/commands/handlers/process-group.handler.spec.ts`

Expected: FAIL because handler only knows `postLimit`.

- [ ] **Step 3: Implement minimal branching**

Refactor `ProcessGroupHandler` so only post retrieval changes:

- `recent_posts` gets one array from `getGroupRecentPosts`
- `recheck_group` loops `for await` over `iterateGroupPosts`
- shared post-processing stays in one helper to avoid duplication

Suggested structure:

```ts
if (mode === ParsingTaskMode.RECHECK_GROUP) {
  for await (const batch of this.vkService.iterateGroupPosts({ ownerId })) {
    await this.processPostsBatch(batch, group, context, taskId, ownerId);
  }
} else {
  const posts = await this.vkService.getGroupRecentPosts({ ownerId, count: postLimit ?? 10 });
  await this.processPostsBatch(posts, group, context, taskId, ownerId);
}
```

- [ ] **Step 4: Run the targeted process-group tests**

Run: `npm --prefix api test -- --run api/src/tasks/commands/handlers/process-group.handler.spec.ts`

Expected: PASS

- [ ] **Step 5: Run a small backend regression slice**

Run: `npm --prefix api test -- --run api/src/tasks/tasks.controller.spec.ts api/src/tasks/parsers/task-description.parser.spec.ts api/src/vk/services/vk-posts.service.spec.ts api/src/tasks/commands/handlers/process-group.handler.spec.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/tasks/commands/handlers/process-group.handler.ts api/src/tasks/commands/handlers/process-group.handler.spec.ts
git commit -m "feat: добавлен режим полной перепроверки групп"
```

## Chunk 3: Frontend mode selection and rendering

### Task 5: Add failing frontend contract and mapper tests for `mode`

**Files:**
- Modify: `front/src/shared/types/dto/create-parsing-task.dto.ts`
- Modify: `front/src/shared/types/api.ts`
- Modify: `front/src/shared/types/common.ts`
- Modify: `front/src/modules/tasks/store/tasksStore.mappers/mappers/mapSummaryToTask.spec.ts` or create
- Modify: `front/src/modules/tasks/store/tasksStore.mappers/mappers/mapResultToTaskDetails.spec.ts` or create
- Modify: `front/src/modules/tasks/store/tasksStore.mappers/extractors/extractTaskData.ts`

- [ ] **Step 1: Write failing mapper tests**

```ts
expect(mapSummaryToTask({
  id: 1,
  createdAt: now,
  status: 'running',
  mode: 'recheck_group',
  postLimit: null,
  title: 'Перепроверка группы: Test',
})).toMatchObject({
  mode: 'recheck_group',
  postLimit: null,
});
```

- [ ] **Step 2: Run the mapper tests and confirm failure**

Run: `npm --prefix front test -- --run front/src/modules/tasks/store/tasksStore.mappers/mappers/mapSummaryToTask.spec.ts front/src/modules/tasks/store/tasksStore.mappers/mappers/mapResultToTaskDetails.spec.ts`

Expected: FAIL because task types and extractors do not know `mode`.

- [ ] **Step 3: Implement frontend contract threading**

Add `mode?: 'recent_posts' | 'recheck_group' | null` to:

- `front/src/shared/types/dto/create-parsing-task.dto.ts`
- `front/src/shared/types/api.ts`
- `front/src/shared/types/common.ts`

Extend `extractTaskData`, `mapSummaryToTask`, `mapResultToTaskDetails`, websocket updates, and store entities so mode survives refresh and socket updates.

- [ ] **Step 4: Run the mapper tests**

Run: `npm --prefix front test -- --run front/src/modules/tasks/store/tasksStore.mappers/mappers/mapSummaryToTask.spec.ts front/src/modules/tasks/store/tasksStore.mappers/mappers/mapResultToTaskDetails.spec.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/shared/types/dto/create-parsing-task.dto.ts front/src/shared/types/api.ts front/src/shared/types/common.ts front/src/modules/tasks/store/tasksStore.mappers/extractors/extractTaskData.ts front/src/modules/tasks/store/tasksStore.mappers/mappers/mapSummaryToTask.ts front/src/modules/tasks/store/tasksStore.mappers/mappers/mapResultToTaskDetails.ts front/src/modules/tasks/hooks/useTasksSocket.ts front/src/modules/tasks/store/tasksStore.mappers/mappers/mapSummaryToTask.spec.ts front/src/modules/tasks/store/tasksStore.mappers/mappers/mapResultToTaskDetails.spec.ts
git commit -m "feat: добавлен режим задач в модели фронтенда"
```

### Task 6: Add the UI flow for `Перепроверить группу`

**Files:**
- Modify: `front/src/modules/tasks/store/tasksStore.ts`
- Modify: `front/src/modules/tasks/components/CreateParseTaskModal.tsx`
- Modify: `front/src/modules/tasks/hooks/useCreateParseTaskModal.ts`
- Modify: `front/src/modules/tasks/components/TasksPage.tsx`
- Modify: `front/src/modules/tasks/components/__tests__/CreateParseTaskModal.test.tsx`

- [ ] **Step 1: Write a failing UI test for mode selection**

```tsx
it('submits recheck_group mode when user selects recheck action', async () => {
  render(<CreateParseTaskModal ... />);

  await user.click(screen.getByRole('button', { name: /перепроверить группу/i }));
  await user.click(screen.getByRole('button', { name: /создать/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    groupIds: [1, 2],
    mode: 'recheck_group',
  });
});
```

- [ ] **Step 2: Run the UI test and confirm failure**

Run: `npm --prefix front test -- --run front/src/modules/tasks/components/__tests__/CreateParseTaskModal.test.tsx`

Expected: FAIL because modal only submits raw `groupIds`.

- [ ] **Step 3: Implement minimal UI changes**

Change the submit contract from only `groupIds` to:

```ts
type CreateTaskPayload = {
  groupIds: Array<number | string>;
  mode: 'recent_posts' | 'recheck_group';
}
```

Implementation notes:

- keep current action as default `recent_posts`
- add a second explicit action/button for `Перепроверить группу`
- reset selected mode when modal closes
- update `tasksStore.createParseTask` to accept `{ groupIds, mode }`
- send `mode` through `tasksService.createParsingTask`

- [ ] **Step 4: Run the UI test**

Run: `npm --prefix front test -- --run front/src/modules/tasks/components/__tests__/CreateParseTaskModal.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tasks/store/tasksStore.ts front/src/modules/tasks/components/CreateParseTaskModal.tsx front/src/modules/tasks/hooks/useCreateParseTaskModal.ts front/src/modules/tasks/components/TasksPage.tsx front/src/modules/tasks/components/__tests__/CreateParseTaskModal.test.tsx
git commit -m "feat: добавлен запуск перепроверки групп из интерфейса задач"
```

### Task 7: Render the new mode in task list and details

**Files:**
- Modify: `front/src/modules/tasks/config/taskTableColumns.tsx`
- Modify: `front/src/modules/tasks/components/TaskDetails/hooks/useTaskStats.ts`
- Modify: `front/src/modules/tasks/components/TaskDetails/components/TaskStatsGrid.tsx`

- [ ] **Step 1: Write failing rendering assertions**

Add tests or existing snapshots asserting:

```tsx
expect(screen.getByText(/режим: перепроверка группы/i)).toBeInTheDocument();
expect(screen.queryByText(/лимит постов:/i)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the targeted frontend tests and confirm failure**

Run: `npm --prefix front test -- --run front/src/modules/tasks/components/__tests__/CreateParseTaskModal.test.tsx`

Expected: FAIL or missing assertions until UI rendering is updated.

- [ ] **Step 3: Implement task rendering rules**

Rules:

- if `mode === 'recheck_group'`, show `Режим: перепроверка`
- if `mode === 'recheck_group'`, hide numeric `postLimit`
- if `mode` missing, treat as legacy `recent_posts`

- [ ] **Step 4: Run frontend regression slice**

Run: `npm --prefix front test -- --run front/src/modules/tasks/components/__tests__/CreateParseTaskModal.test.tsx front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`

Expected: PASS for task tests, no unrelated regressions in shared frontend test setup.

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tasks/config/taskTableColumns.tsx front/src/modules/tasks/components/TaskDetails/hooks/useTaskStats.ts front/src/modules/tasks/components/TaskDetails/components/TaskStatsGrid.tsx
git commit -m "feat: отображен режим перепроверки в задачах"
```

## Chunk 4: Final verification

### Task 8: Run focused verification and document residual risks

**Files:**
- No code changes required unless fixes are needed

- [ ] **Step 1: Run backend verification**

Run: `npm --prefix api test -- --run api/src/tasks/tasks.controller.spec.ts api/src/tasks/parsers/task-description.parser.spec.ts api/src/vk/services/vk-posts.service.spec.ts api/src/vk/vk.service.spec.ts api/src/tasks/commands/handlers/process-group.handler.spec.ts api/src/tasks/commands/handlers/create-parsing-task.handler.spec.ts`

Expected: PASS

- [ ] **Step 2: Run frontend verification**

Run: `npm --prefix front test -- --run front/src/modules/tasks/components/__tests__/CreateParseTaskModal.test.tsx front/src/modules/tasks/store/tasksStore.mappers/mappers/mapSummaryToTask.spec.ts front/src/modules/tasks/store/tasksStore.mappers/mappers/mapResultToTaskDetails.spec.ts`

Expected: PASS

- [ ] **Step 3: Run lint/typecheck if they are standard in this repo**

Run: `npm --prefix api run lint`
Run: `npm --prefix front run lint`

Expected: PASS

- [ ] **Step 4: Review manually**

Check:

- create normal task still sends `recent_posts`
- create recheck task sends `recheck_group`
- task table and task details show correct labels
- recheck task does not show misleading `Лимит постов: 10`

- [ ] **Step 5: Final commit if verification required code fixes**

```bash
git add <fixed-files>
git commit -m "fix: завершена верификация перепроверки групп"
```

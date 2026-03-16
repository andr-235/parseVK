# Parsing Performance Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить профилирование больших задач парсинга, защиту от зависающих групп и основу для последующей точечной оптимизации подтверждённого bottleneck.

**Architecture:** Сначала вводим компактную модель performance-summary и покрываем её тестами в общем backend-пути `processor -> execute handler -> process-group -> VK retry`. Затем добавляем fail-fast защиту от длинного хвоста отдельных групп и только после этого используем новые метрики для узкой оптимизации найденного bottleneck. План избегает широкого рефакторинга очереди и фронтенда и концентрируется на существующих backend-компонентах задач.

**Tech Stack:** NestJS, BullMQ, Prisma, Bun, Vitest, VK API, Prometheus metrics

---

## File Map

- Read/verify: `docs/superpowers/specs/2026-03-16-parsing-performance-design.md`
- Modify: `api/src/tasks/queues/parsing.processor.ts`
- Modify: `api/src/tasks/commands/handlers/execute-parsing-task.handler.ts`
- Modify: `api/src/tasks/commands/handlers/process-group.handler.ts`
- Modify: `api/src/tasks/interfaces/parsing-task-result.interface.ts`
- Modify: `api/src/tasks/interfaces/parsing-stats.interface.ts`
- Modify if needed: `api/src/tasks/mappers/task.mapper.ts`
- Modify if needed: `api/src/tasks/repositories/parsing-task.repository.ts`
- Modify if needed: `api/src/metrics/metrics.service.ts`
- Modify if needed: `api/src/vk/services/vk-api-retry.service.ts`
- Test: `api/src/tasks/commands/handlers/process-group.handler.spec.ts`
- Test: `api/src/vk/services/vk-api-retry.service.spec.ts`
- Create: `api/src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts`
- Create if needed: `api/src/tasks/queues/parsing.processor.spec.ts`
- Create if needed: `api/src/tasks/testing/parsing-performance.fixtures.ts`
- Create if needed: `docs/superpowers/plans/2026-03-16-parsing-performance-implementation.md`

## Chunk 1: Каркас performance-summary

### Task 1: Описать контракт performance-summary задачи

**Files:**
- Read: `docs/superpowers/specs/2026-03-16-parsing-performance-design.md`
- Modify: `api/src/tasks/interfaces/parsing-task-result.interface.ts`
- Modify: `api/src/tasks/interfaces/parsing-stats.interface.ts`
- Test if needed: `api/src/tasks/mappers/task.mapper.spec.ts`

- [ ] **Step 1: Прочитать spec и текущие task interfaces**

Run: `sed -n '1,240p' docs/superpowers/specs/2026-03-16-parsing-performance-design.md && sed -n '1,240p' api/src/tasks/interfaces/parsing-task-result.interface.ts && sed -n '1,240p' api/src/tasks/interfaces/parsing-stats.interface.ts`
Expected: видно текущий контракт результата и место для summary/стадий

- [ ] **Step 2: Написать или обновить тест на маппинг summary в DTO задачи**

```ts
it('maps compact parsing performance summary', () => {
  const result = mapper.mapToSummary(task, parsed, 'running');
  expect(result.performanceSummary).toMatchObject({
    totalDurationMs: 1200,
    stages: { groupFetch: { count: 10 } },
  });
});
```

- [ ] **Step 3: Запустить точечный тест и убедиться, что он падает**

Run: `cd api && bun x vitest run src/tasks/mappers/task.mapper.spec.ts`
Expected: FAIL из-за отсутствующего поля `performanceSummary` или несовместимого контракта

- [ ] **Step 4: Минимально расширить interfaces под compact summary**

```ts
export interface ParsingPerformanceStageSummary {
  totalDurationMs: number;
  count: number;
  retries: number;
  timeouts: number;
}

export interface ParsingPerformanceSummary {
  totalDurationMs: number;
  processedGroups: number;
  stages: Record<string, ParsingPerformanceStageSummary>;
}
```

- [ ] **Step 5: Обновить mapper/types под новый контракт**

Run: `cd api && bun x vitest run src/tasks/mappers/task.mapper.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add api/src/tasks/interfaces/parsing-task-result.interface.ts api/src/tasks/interfaces/parsing-stats.interface.ts api/src/tasks/mappers/task.mapper.ts api/src/tasks/mappers/task.mapper.spec.ts
git commit -m "feat: добавлен контракт performance summary задач"
```

### Task 2: Добавить unit-тест на агрегирование summary в execute handler

**Files:**
- Create: `api/src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts`
- Modify: `api/src/tasks/commands/handlers/execute-parsing-task.handler.ts`

- [ ] **Step 1: Написать падающий тест на сбор агрегатов по этапам**

```ts
it('aggregates stage timings and stores compact performance summary', async () => {
  await handler.execute(command);
  expect(tasksRepository.updateResult).toHaveBeenCalledWith(
    expect.any(Number),
    expect.objectContaining({
      performanceSummary: expect.objectContaining({
        processedGroups: 2,
        stages: expect.objectContaining({
          group_fetch: expect.objectContaining({ totalDurationMs: 300 }),
        }),
      }),
    }),
  );
});
```

- [ ] **Step 2: Запустить новый тест и увидеть падение**

Run: `cd api && bun x vitest run src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts`
Expected: FAIL, потому что handler ещё не собирает summary

- [ ] **Step 3: Реализовать минимальный aggregation helper в execute handler**

```ts
const summary = createEmptyPerformanceSummary();
summary.totalDurationMs += elapsedMs;
summary.stages[stageKey] = mergeStage(summary.stages[stageKey], sample);
```

- [ ] **Step 4: Сохранить compact summary в итог результата задачи**

Run: `cd api && bun x vitest run src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/tasks/commands/handlers/execute-parsing-task.handler.ts api/src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts
git commit -m "feat: добавлена агрегация performance summary у задач"
```

## Chunk 2: Замеры на группе и во внешних вызовах

### Task 3: Покрыть замеры выполнения одной группы

**Files:**
- Modify: `api/src/tasks/commands/handlers/process-group.handler.ts`
- Test: `api/src/tasks/commands/handlers/process-group.handler.spec.ts`
- Create if needed: `api/src/tasks/testing/parsing-performance.fixtures.ts`

- [ ] **Step 1: Добавить падающий тест на возврат stage metrics для группы**

```ts
it('returns per-group performance metrics for vk fetch and persistence', async () => {
  const result = await handler.execute(command);
  expect(result.performance).toMatchObject({
    totalDurationMs: expect.any(Number),
    stages: expect.objectContaining({
      posts_fetch: expect.any(Object),
      comments_fetch: expect.any(Object),
      db_write: expect.any(Object),
    }),
  });
});
```

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `cd api && bun x vitest run src/tasks/commands/handlers/process-group.handler.spec.ts`
Expected: FAIL, потому что handler возвращает только старый результат

- [ ] **Step 3: Минимально расширить return type process-group handler**

```ts
return {
  ok: true,
  performance: buildGroupPerformanceSummary(samples),
};
```

- [ ] **Step 4: Замерить участки VK fetch, processing и DB persist внутри handler**

Run: `cd api && bun x vitest run src/tasks/commands/handlers/process-group.handler.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/tasks/commands/handlers/process-group.handler.ts api/src/tasks/commands/handlers/process-group.handler.spec.ts api/src/tasks/testing/parsing-performance.fixtures.ts
git commit -m "feat: добавлены метрики этапов обработки группы"
```

### Task 4: Учесть retry/timeout и длительности VK API

**Files:**
- Modify: `api/src/vk/services/vk-api-retry.service.ts`
- Test: `api/src/vk/services/vk-api-retry.service.spec.ts`
- Modify if needed: `api/src/metrics/metrics.service.ts`

- [ ] **Step 1: Написать тест на публикацию retry/timeout telemetry**

```ts
it('returns retry telemetry with timeout classification and duration', async () => {
  const result = await service.execute('wall.get', fn);
  expect(result.telemetry).toMatchObject({
    attempts: 3,
    timeoutCount: 1,
    totalDurationMs: expect.any(Number),
  });
});
```

- [ ] **Step 2: Запустить тест и зафиксировать падение**

Run: `cd api && bun x vitest run src/vk/services/vk-api-retry.service.spec.ts`
Expected: FAIL, telemetry ещё не возвращается

- [ ] **Step 3: Реализовать минимальный telemetry payload для retry service**

```ts
return {
  data,
  telemetry: {
    attempts,
    timeoutCount,
    rateLimitCount,
    totalDurationMs,
  },
};
```

- [ ] **Step 4: Прокинуть telemetry в process-group metrics без слома существующих вызовов**

Run: `cd api && bun x vitest run src/vk/services/vk-api-retry.service.spec.ts src/tasks/commands/handlers/process-group.handler.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/vk/services/vk-api-retry.service.ts api/src/vk/services/vk-api-retry.service.spec.ts api/src/metrics/metrics.service.ts api/src/tasks/commands/handlers/process-group.handler.ts
git commit -m "feat: добавлена telemetry retry и timeout vk api"
```

## Chunk 3: Защита от длинного хвоста и зависающих групп

### Task 5: Добавить per-group timeout в execute pipeline

**Files:**
- Modify: `api/src/tasks/commands/handlers/execute-parsing-task.handler.ts`
- Test: `api/src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts`
- Modify if needed: `api/src/tasks/interfaces/parsing-task-runner.types.ts`

- [ ] **Step 1: Написать тест на timeout одной группы без остановки общей job**

```ts
it('marks a slow group as timed_out and continues processing remaining groups', async () => {
  await handler.execute(command);
  expect(tasksRepository.updateProgress).toHaveBeenCalledWith(
    expect.any(Number),
    expect.objectContaining({ timedOut: 1, processed: 2 }),
  );
});
```

- [ ] **Step 2: Запустить execute-handler test suite и увидеть падение**

Run: `cd api && bun x vitest run src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts`
Expected: FAIL, общей timeout-защиты по группе ещё нет

- [ ] **Step 3: Реализовать ограничение времени на группу с явной классификацией `timed_out`**

```ts
const outcome = await runWithTimeout(() => processGroup(group), groupTimeoutMs);
if (outcome.kind === 'timeout') {
  summary.timedOutGroups += 1;
  continue;
}
```

- [ ] **Step 4: Обновить итоговый summary и прогресс задачи**

Run: `cd api && bun x vitest run src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/tasks/commands/handlers/execute-parsing-task.handler.ts api/src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts api/src/tasks/interfaces/parsing-task-runner.types.ts
git commit -m "fix: ограничено время обработки одной группы"
```

### Task 6: Добавить heartbeat и периодический summary на уровне processor

**Files:**
- Modify: `api/src/tasks/queues/parsing.processor.ts`
- Create if needed: `api/src/tasks/queues/parsing.processor.spec.ts`

- [ ] **Step 1: Написать тест на публикацию heartbeat/progress summary во время длинной job**

```ts
it('emits periodic heartbeat with performance summary while job is running', async () => {
  await processor.process(job);
  expect(job.updateProgress).toHaveBeenCalledWith(
    expect.objectContaining({
      performanceSummary: expect.objectContaining({ processedGroups: 10 }),
    }),
  );
});
```

- [ ] **Step 2: Запустить тест и увидеть падение**

Run: `cd api && bun x vitest run src/tasks/queues/parsing.processor.spec.ts`
Expected: FAIL, heartbeat summary отсутствует

- [ ] **Step 3: Реализовать минимальный heartbeat в processor**

```ts
await job.updateProgress({
  ...progress,
  performanceSummary: compactSummary,
  heartbeatAt: new Date().toISOString(),
});
```

- [ ] **Step 4: Проверить, что формат прогресса совместим с текущими consumer-ами**

Run: `cd api && bun x vitest run src/tasks/queues/parsing.processor.spec.ts src/tasks/tasks.controller.spec.ts src/tasks/mappers/task.mapper.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add api/src/tasks/queues/parsing.processor.ts api/src/tasks/queues/parsing.processor.spec.ts api/src/tasks/tasks.controller.spec.ts api/src/tasks/mappers/task.mapper.spec.ts
git commit -m "feat: добавлен heartbeat summary очереди парсинга"
```

## Chunk 4: Подтверждение bottleneck и точечная оптимизация

### Task 7: Подготовить диагностический отчёт по реальному большому прогону

**Files:**
- Read: runtime logs and task result payload
- Modify if needed: `api/src/tasks/commands/handlers/execute-parsing-task.handler.ts`

- [ ] **Step 1: Запустить релевантные backend-тесты перед реальным прогоном**

Run: `cd api && bun x vitest run src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts src/tasks/commands/handlers/process-group.handler.spec.ts src/tasks/queues/parsing.processor.spec.ts src/vk/services/vk-api-retry.service.spec.ts`
Expected: PASS

- [ ] **Step 2: Выполнить один большой staging/prod-like прогон и собрать summary**

Run: использовать штатный запуск большой parsing task в целевой среде
Expected: получен compact summary с totalDurationMs, stage breakdown, retries, timeouts и p95

- [ ] **Step 3: Зафиксировать главный bottleneck и выбрать ровно одну оптимизацию**

Expected: один подтверждённый вывод, например `comments_fetch` или `db_write` как главный источник задержки

### Task 8: Реализовать ровно одну оптимизацию подтверждённого bottleneck

**Files:**
- Modify: только файл подтверждённого bottleneck, например `api/src/tasks/commands/handlers/process-group.handler.ts` или `api/src/vk/services/vk-api-retry.service.ts`
- Test: ближайший релевантный spec

- [ ] **Step 1: Добавить падающий тест для выбранной оптимизации**

```ts
it('processes independent group fetches with bounded concurrency of 4', async () => {
  const result = await handler.execute(command);
  expect(result.performance.stages.group_fetch.totalDurationMs).toBeLessThan(knownBaseline);
});
```

- [ ] **Step 2: Запустить точечный тест и подтвердить падение**

Run: `cd api && bun x vitest run <relevant-spec>`
Expected: FAIL по выбранной оптимизации

- [ ] **Step 3: Внести минимальный фикс только в подтверждённый bottleneck**

Run: `cd api && bun x vitest run <relevant-spec>`
Expected: PASS

- [ ] **Step 4: Повторить реальный прогон и сравнить summary до/после**

Expected: подтверждённое ускорение по главному этапу и по totalDurationMs

- [ ] **Step 5: Commit**

```bash
git add <touched-files>
git commit -m "perf: ускорен подтвержденный bottleneck задач парсинга"
```

## Chunk 5: Итоговая верификация и документация

### Task 9: Выполнить финальную верификацию и обновить документы

**Files:**
- Read/verify: `docs/superpowers/specs/2026-03-16-parsing-performance-design.md`
- Modify if needed: `docs/superpowers/plans/2026-03-16-parsing-performance-implementation.md`
- Modify if needed: `CHANGELOG.md`

- [ ] **Step 1: Запустить весь релевантный набор backend-тестов**

Run: `cd api && bun x vitest run src/tasks/commands/handlers/execute-parsing-task.handler.spec.ts src/tasks/commands/handlers/process-group.handler.spec.ts src/tasks/queues/parsing.processor.spec.ts src/vk/services/vk-api-retry.service.spec.ts src/tasks/mappers/task.mapper.spec.ts`
Expected: PASS

- [ ] **Step 2: Проверить, что итоговый payload задачи читается текущим API/UI**

Run: `cd api && bun x vitest run src/tasks/tasks.controller.spec.ts src/tasks/mappers/task.mapper.spec.ts`
Expected: PASS

- [ ] **Step 3: Кратко задокументировать подтверждённый bottleneck и эффект оптимизации**

Expected: в plan/spec или changelog добавлена заметка о том, что именно ускорено и как это измерено

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-03-16-parsing-performance-implementation.md CHANGELOG.md
git commit -m "docs: обновлен план ускорения задач парсинга"
```

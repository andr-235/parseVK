# План: Рефакторинг страницы задач (Tasks)

**Время выполнения:** ~4-6 часов  
**Тесты:** Да (модульные + компонентные)  
**Документация:** Да (внутренние комментарии, JSDoc)

---

## Проблемы текущей архитектуры

1. **God-хук `useTasksViewModel`** (214 строк) — управляет данными из 3 стора, состоянием модалок,
   создаёт все коллбэки, вычисляет производное состояние. Нарушает SRP.
2. **Дублирование утилит** — `formatDate` определён в 2 местах (`config/utils.ts` + `TaskDetails/utils/formatters.ts`).
   Статус-хелперы дублируются между `statusHelpers.ts` и `formatters.ts`.
3. **Сложность мапперов** — `mapResultToTaskDetails.ts` (340 строк) и `mapSummaryToTask.ts` (205 строк)
   содержат сложную логику с множеством `firstDefined` и каскадных дериваций.
4. **Prop drilling в TasksPage** — 18+ пропсов передаются через `useTasksViewModel` в 5 дочерних компонентов.
5. **Дублирование action-логики** — `TaskActionsCell.tsx` (120 строк) и `TaskDetails/hooks/useTaskActions.ts` (51 строка)
   реализуют похожие паттерны независимо.
6. **Inline-стили в TaskItem** — `getStatusColor` + `getStatusIcon` смешаны с рендерингом (259 строк).

---

## План работ

### Этап 1: Консолидация утилит (1 час)

**1.1. Устранить дублирование `formatDate`**
- [ ] Перенести `formatDate` из `config/utils.ts` и `TaskDetails/utils/formatters.ts` в общий `utils/format.ts`.
- [ ] Обновить импорты во всех потребителях.

**1.2. Слить статус-хелперы**
- [ ] Перенести `taskStatusClasses`, `groupStatusClasses`, `STATUS_BADGE_BASE` из `TaskDetails/utils/formatters.ts`
      в `utils/statusHelpers.ts`.
- [ ] Экспортировать `getTaskStatusText` и `getGroupStatusText` оттуда же (уже есть).
- [ ] Удалить дублирующийся файл `TaskDetails/utils/formatters.ts`.
- [ ] Удалить `config/utils.ts` (остался только `formatDate`, `formatPair`, `toNumber`, `resolveNumber` —
      перенести в `utils/format.ts`).

**1.3. Выделить `statusConfig.ts`**
- [ ] Создать `config/statusConfig.ts` с конфигурациями:
  ```ts
  // Маппинг статус → цвет/иконка/текст для консистентности между TaskItem, TasksTableCard
  export const STATUS_STYLES: Record<TaskStatus, { icon: LucideIcon; badge: string; progressTone: string }>
  export const STATUS_BADGE_CLASSES: Record<TaskStatus, string>
  ```
- [ ] Переиспользовать в `TaskItem.tsx`, `taskTableColumns.tsx`, `TaskDetailsHeader.tsx`.

### Этап 2: Оптимизация стора и мапперов (1.5 часа)

**2.1. Разделить `tasksStore.utils.ts` (536 строк)**
- [ ] Выделить модули:
  - `store/helpers/normalize.ts` — `normalizeId`, `toNumber`, `firstDefined`, `parseJsonObject`, `normalizeTaskStatusValue`, `normalizeGroupStatusValue`
  - `store/helpers/status.ts` — `deriveTaskStatus`, `deriveGroupStatus`, `isTaskActive`, `deriveFallbackStatus`
  - `store/helpers/stats.ts` — `mergeStats`, `cleanStats`, `calculateTaskProgress`
  - `store/helpers/entity.ts` — `toTaskKey`, `rebuildTaskList`, `replaceTasksCollection`, `upsertTaskEntity`, `ensureTaskDetailsStore`
  - `store/helpers/groups.ts` — `ensureGroupsLoaded`, `findGroupMetadata`, `collectGroupIds`, `extractGroups`
- [ ] Обновить импорты во всех файлах, использующих эти функции.

**2.2. Упростить мапперы**
- [ ] `mapSummaryToTask.ts`: Выделить локальную функцию `computeCounts` для 3 блоков подряд (`calculateProcessedItems`,
      `calculateProcessedGroupsCount`, `calculateAssumedProcessedGroups`).
- [ ] `mapResultToTaskDetails.ts`: Вынести группы-заполнители в отдельный хелпер `fillMissingGroups`.
- [ ] Заменить цепочки `firstDefined` с 8+ аргументов на `??` + приоритет-функции.
- [ ] Проверить: некоторые вызовы `firstDefined` избыточны (например, `source.groupIds ?? null` вместо
      `Array.isArray(x) ? x : null`).

### Этап 3: Дедупликация action-хуков (0.5 часа)

**3.1. Объединить useTaskActions**
- [ ] Сохранить `hooks/useTaskActions.ts` как единственный источник.
- [ ] Перенести в него `isResuming/isChecking/isDeleting` локальные стейты.
- [ ] `TaskDetails/hooks/useTaskActions.ts` (под-компонента) — переиспользовать общий хук.
- [ ] `TaskActionsCell.tsx` — переиспользовать общий хук.
- [ ] `TaskItem.tsx` — переиспользовать общий хук (уже использует, ок).
- [ ] Удалить `TaskDetails/hooks/useTaskActions.ts`.

### Этап 4: Рефакторинг TasksPage (1 час)

**4.1. Выделить sub-хуки из useTasksViewModel**
- [ ] `useTaskAutomation()` — управление состоянием автоматизации (settings + run).
- [ ] `useCreateTaskDialog()` — управление модалкой создания задачи.
- [ ] `useTaskSelection()` — управление выбором/закрытием деталей задачи.
- [ ] `useTaskDerivedState(tasks)` — вычисление `activeTasks`, `formattedLastUpdated`, `emptyMessage`.

**4.2. TasksPage — чистка**
- [ ] `TasksPage` импортирует sub-хуки вместо одного God-хука.
- [ ] Пропсы передаются только там, где это необходимо (можно использовать `children`-композицию).

### Этап 5: Чистка TaskItem (0.5 часа)

**5.1. Использовать statusConfig из Этапа 1.3**
- [ ] Заменить `getStatusColor` и `getStatusIcon` на конфиг.
- [ ] Вынести render-логику stats grid в отдельный `TaskStatsRow` компонент.

### Этап 6: Тесты (1 час)

**6.1. Существующие тесты (убедиться, что проходят)**
- [ ] `mapSummaryToTask.spec.ts`
- [ ] `mapResultToTaskDetails.spec.ts`
- [ ] `CreateParseTaskModal.test.tsx`
- [ ] `TaskModeRendering.test.tsx`
- [ ] `useTasksSocket.test.ts`

**6.2. Новые тесты**
- [ ] `utils/__tests__/format.test.ts` — для новых общих утилит.
- [ ] `utils/__tests__/statusHelpers.test.ts` — для статус-хелперов с конфигом.
- [ ] `store/helpers/__tests__/normalize.test.ts` — для normalizeId, firstDefined, toNumber.
- [ ] `store/helpers/__tests__/entity.test.ts` — для rebuildTaskList, upsertTaskEntity.
- [ ] `hooks/__tests__/useTasksViewModel.test.ts` — ключевые сценарии (если хук сохранится).

### Этап 7: Проверка типов и линтер

- [ ] Запустить `npm run typecheck` (или `npx tsc --noEmit`) — убедиться, что всё типобезопасно.
- [ ] Запустить `npm run lint` — убедиться, что линтер чист.
- [ ] Запустить существующий тест-сьют: `npm test -- --related=src/modules/tasks`.

---

## Документация

- JSDoc для всех экспортируемых функций в новых модулях (`utils/`, `store/helpers/`).
- Внутренние комментарии только для неочевидных решений (см. AGENTS.md: "минимальные, осмысленные, технически полезные").

---

## Риски

- **Сломанные импорты** при выделении `store/helpers/` — требуется аккуратное обновление 10+ файлов.
- **Изменение публичного API** стора (селекторы, экшены) — может затронуть другие модули (Settings, Groups).
  → Проверить импорты из `@/modules/tasks` перед финальным коммитом.
- **Регрессия в UI** — после замены `getStatusColor`/`getStatusIcon` на конфиг нужно сверить визуально.

---

## Порядок выполнения

1. Этап 1 (консолидация утилит) — низкий риск, сразу даёт улучшение.
2. Этап 6.1 (запустить существующие тесты) — baseline.
3. Этап 2 (стор/мапперы/хелперы) — основная работа.
4. Этап 3 (дедупликация хуков) — безопасно, т.к. меняется только внутренняя структура.
5. Этап 4 (TasksPage) — последний, т.к. зависит от Этапа 3.
6. Этап 5 (TaskItem) — финальный штрих.
7. Этап 6.2 (новые тесты) — после всех изменений.
8. Этап 7 (проверка) — финальная верификация.

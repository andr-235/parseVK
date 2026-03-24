# Tgmbase Search UI/UX Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перестроить страницу `tgmbase-search` в удобный экран для больших батчей с фильтрами, `master-detail` разметкой и быстрым просмотром деталей выбранной записи.

**Architecture:** Поверх существующего `useTgmbaseSearchState` добавляется отдельный слой UI-состояния для фильтров, сортировки и выбранной записи. Линейный поток `форма -> таблица -> карточки` заменяется на sticky-toolbar, summary-фильтры и двухпанельное рабочее пространство `results list + details panel`, где детали рендерятся только для активной записи.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Vitest, Testing Library.

---

## Chunk 1: Подготовить данные и UX-контракт экрана

### Task 1: Зафиксировать derived state и правила выбора тестами

**Files:**
- Create: `front/src/modules/tgmbase-search/hooks/useTgmbaseResultsViewModel.ts`
- Create: `front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts`
- Reference: `front/src/modules/tgmbase-search/hooks/useTgmbaseSearchState.ts`
- Reference: `front/src/shared/types/api.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('prioritizes problematic rows and autoselects first visible item', () => {
  const vm = renderHook(() =>
    useTgmbaseResultsViewModel({
      items: makeItems(['found', 'error', 'not_found']),
      selectedQuery: null,
    })
  )

  expect(vm.result.current.visibleItems[0].status).toBe('error')
  expect(vm.result.current.selectedItem?.status).toBe('error')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --cwd front test front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts`
Expected: FAIL because the view-model hook does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement `useTgmbaseResultsViewModel.ts` with:
- filter state for statuses, query types, presence flags, text search, sort mode
- memoized `visibleItems`
- selection fallback when current item is filtered out
- default sort that lifts `error`, `not_found`, `ambiguous`, `invalid` above `found`

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --cwd front test front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tgmbase-search/hooks/useTgmbaseResultsViewModel.ts front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts
git commit -m "test: зафиксировать view model фильтров tgmbase"
```

### Task 2: Добавить тесты на поиск, комбинированные фильтры и сортировку

**Files:**
- Modify: `front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts`
- Modify: `front/src/modules/tgmbase-search/hooks/useTgmbaseResultsViewModel.ts`

- [ ] **Step 1: Write the failing tests**

Add tests for:
- text search across `query`, `fullName`, `username`, `phone`, chat titles
- combining `status + queryType + hasMessages`
- preserving selected item across sort changes
- empty visible list state

- [ ] **Step 2: Run targeted tests and verify they fail**

Run: `bun --cwd front test front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts`
Expected: FAIL on the new assertions.

- [ ] **Step 3: Implement the minimal logic**

Extend the hook with:
- normalized search index
- stable sorting
- helper predicates for presence flags
- reset helpers for filters

- [ ] **Step 4: Run targeted tests and verify they pass**

Run: `bun --cwd front test front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tgmbase-search/hooks/useTgmbaseResultsViewModel.ts front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts
git commit -m "feat: добавить фильтрацию и сортировку результатов tgmbase"
```

## Chunk 2: Собрать верхнюю панель запуска и summary

### Task 3: Перестроить форму в sticky-toolbar

**Files:**
- Create: `front/src/modules/tgmbase-search/components/TgmbaseBatchToolbar.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSearchForm.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx`
- Test: `front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`

- [ ] **Step 1: Write the failing page test**

Add assertions that the page renders:
- compact batch toolbar
- query count
- progress summary region
- actions `Очистить`, `Найти`, `Новый батч`

- [ ] **Step 2: Run targeted page test and verify it fails**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: FAIL because the new toolbar structure is missing.

- [ ] **Step 3: Implement the minimal UI**

Create `TgmbaseBatchToolbar.tsx` and move into it:
- batch input area
- query count
- supported-format helper copy
- compact progress summary

Update `TgmbaseSearchPage.tsx` to use the new toolbar instead of the current standalone form + progress block sequence.

- [ ] **Step 4: Run targeted page test and verify it passes**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tgmbase-search/components/TgmbaseBatchToolbar.tsx front/src/modules/tgmbase-search/components/TgmbaseSearchForm.tsx front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx
git commit -m "feat: собрать верхнюю панель батча для tgmbase"
```

### Task 4: Заменить summary-таблицу на кликабельный обзор батча

**Files:**
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultsSummary.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSummaryTable.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx`
- Test: `front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that clicking summary cards toggles status filters and updates the visible results count.

- [ ] **Step 2: Run targeted page test and verify it fails**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: FAIL because summary cards are not interactive yet.

- [ ] **Step 3: Implement the minimal UI**

Create summary cards for:
- total
- found
- not_found
- ambiguous
- invalid
- error

Wire clicks to the results view-model instead of scrolling to monolithic result cards.

- [ ] **Step 4: Run targeted page test and verify it passes**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tgmbase-search/components/TgmbaseResultsSummary.tsx front/src/modules/tgmbase-search/components/TgmbaseSummaryTable.tsx front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx
git commit -m "feat: добавить summary фильтры на странице tgmbase"
```

## Chunk 3: Построить рабочую область master-detail

### Task 5: Добавить список результатов с выбором и клавиатурной навигацией

**Files:**
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultsWorkspace.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultsFilters.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultsList.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx`
- Test: `front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`

- [ ] **Step 1: Write the failing page tests**

Add tests for:
- rendering a left-side result list instead of all expanded cards
- selecting a row updates active state
- keyboard arrows move selection
- text search narrows the visible list

- [ ] **Step 2: Run targeted page test and verify it fails**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: FAIL because the workspace and keyboard interactions do not exist yet.

- [ ] **Step 3: Implement the minimal UI**

Create a list view that renders for each row:
- query
- query type
- localized status
- primary identity text
- compact counts for chats, contacts, messages

Add keyboard selection support and wire the global search input plus quick filters.

- [ ] **Step 4: Run targeted page test and verify it passes**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tgmbase-search/components/TgmbaseResultsWorkspace.tsx front/src/modules/tgmbase-search/components/TgmbaseResultsFilters.tsx front/src/modules/tgmbase-search/components/TgmbaseResultsList.tsx front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx
git commit -m "feat: добавить список результатов tgmbase с фильтрами"
```

### Task 6: Выделить правую панель деталей выбранной записи

**Files:**
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultDetails.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultOverview.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultGroups.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultContacts.tsx`
- Create: `front/src/modules/tgmbase-search/components/TgmbaseResultMessages.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseMessagesPanel.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseResultCard.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx`
- Test: `front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`

- [ ] **Step 1: Write the failing page test**

Add assertions that:
- only the selected item detail panel is rendered
- switching rows changes overview, groups, contacts, and messages content
- empty detail state appears when nothing is visible after filtering

- [ ] **Step 2: Run targeted page test and verify it fails**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: FAIL because the page still renders per-item cards in a linear list.

- [ ] **Step 3: Implement the minimal UI**

Build `TgmbaseResultDetails.tsx` as the right panel and move detail sections into smaller focused components. Reuse `loadMoreMessages` for the active item only.

- [ ] **Step 4: Run targeted page test and verify it passes**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tgmbase-search/components/TgmbaseResultDetails.tsx front/src/modules/tgmbase-search/components/TgmbaseResultOverview.tsx front/src/modules/tgmbase-search/components/TgmbaseResultGroups.tsx front/src/modules/tgmbase-search/components/TgmbaseResultContacts.tsx front/src/modules/tgmbase-search/components/TgmbaseResultMessages.tsx front/src/modules/tgmbase-search/components/TgmbaseMessagesPanel.tsx front/src/modules/tgmbase-search/components/TgmbaseResultCard.tsx front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx
git commit -m "feat: вынести панель деталей результата tgmbase"
```

## Chunk 4: Завершить состояния и проверить UX

### Task 7: Довести пустые состояния, новый запуск и адаптивность

**Files:**
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseBatchToolbar.tsx`
- Modify: `front/src/modules/tgmbase-search/components/TgmbaseResultsWorkspace.tsx`
- Test: `front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add coverage for:
- pre-submit helper state with supported formats
- empty visible list after filters
- replacing previous batch with a new run
- responsive layout markers for mobile/tablet/desktop containers

- [ ] **Step 2: Run targeted page test and verify it fails**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: FAIL on the new UI-state assertions.

- [ ] **Step 3: Implement the minimal UI**

Add:
- explicit empty state with reset-filters action
- `Новый батч` flow that clears the previous result and filter state
- responsive layout classes for stacked detail panel on smaller breakpoints

- [ ] **Step 4: Run targeted page test and verify it passes**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/tgmbase-search/components/TgmbaseSearchPage.tsx front/src/modules/tgmbase-search/components/TgmbaseBatchToolbar.tsx front/src/modules/tgmbase-search/components/TgmbaseResultsWorkspace.tsx front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx
git commit -m "feat: завершить состояния интерфейса tgmbase"
```

### Task 8: Выполнить итоговую проверку

**Files:**
- Test: `front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts`
- Test: `front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`

- [ ] **Step 1: Run hook tests**

Run: `bun --cwd front test front/src/modules/tgmbase-search/hooks/__tests__/useTgmbaseResultsViewModel.test.ts`
Expected: PASS

- [ ] **Step 2: Run page tests**

Run: `bun --cwd front test front/src/modules/tgmbase-search/__tests__/TgmbaseSearchPage.test.tsx`
Expected: PASS

- [ ] **Step 3: Run focused frontend verification**

Run: `bun --cwd front test front/src/modules/tgmbase-search`
Expected: PASS for the tgmbase-search related test set.

- [ ] **Step 4: Commit**

```bash
git add front/src/modules/tgmbase-search
git commit -m "test: подтвердить редизайн страницы tgmbase"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-24-tgmbase-search-ui-ux.md`. Ready to execute?

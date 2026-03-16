# Comments Infinite Scroll Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the comments page infinite scroll and make counters consistent without replacing the current cursor-based UX.

**Architecture:** Keep `cursor` pagination as the source of truth for server-side counters and pagination state, while separating client-side derived counters used only for rendering. Limit automatic load-more chaining in `CommentsTableCard` so the first render can fill the viewport once, but subsequent loads require a fresh intersection or user scroll.

**Tech Stack:** React, Zustand, TanStack Query, Vitest, Testing Library

---

## File Structure

- Modify: `front/src/modules/comments/components/CommentsTableCard.tsx`
  Owns the infinite-scroll trigger and the on-screen counter copy.
- Modify: `front/src/modules/comments/hooks/useCommentsViewModel.ts`
  Exposes a stricter counter contract for UI consumption.
- Modify: `front/src/modules/comments/hooks/useCommentsQuery.ts`
  Keeps background sync aligned with store state without corrupting pagination state.
- Modify: `front/src/modules/comments/store/commentsStore.ts`
  Preserves server pagination state and loaded item counts as the source of truth.
- Modify: `front/src/modules/comments/components/__tests__/CommentsTableCard.test.tsx`
  Covers counter rendering and load-more triggering rules.
- Modify: `front/src/modules/comments/hooks/__tests__/useCommentsViewModel.test.ts`
  Covers the renamed/separated counter contract from the view model.
- Modify: `front/src/modules/comments/hooks/__tests__/useCommentsQuery.test.ts`
  Covers merge behavior between background sync data and already loaded pages.

## Chunk 1: Counter Contract

### Task 1: Lock the view-model counter API with tests

**Files:**
- Modify: `front/src/modules/comments/hooks/__tests__/useCommentsViewModel.test.ts`
- Modify: `front/src/modules/comments/hooks/useCommentsViewModel.ts`

- [ ] **Step 1: Write a failing test for separated counters**

Add assertions that the view model exposes:
- `totalCount` from API/store
- `loadedCount` from currently loaded comments
- `renderedCount` from filtered/grouped output

Use the existing store mocks in `front/src/modules/comments/hooks/__tests__/useCommentsViewModel.test.ts`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix front test -- src/modules/comments/hooks/__tests__/useCommentsViewModel.test.ts`
Expected: FAIL because the current hook still conflates rendered/visible values.

- [ ] **Step 3: Implement the minimal view-model contract**

Update `front/src/modules/comments/hooks/useCommentsViewModel.ts` so that:
- `totalCount` remains the server total;
- `loadedCount` reflects `comments.length` in normal mode;
- `renderedCount` reflects the locally rendered count after filters/grouping;
- existing search-mode behavior stays untouched unless it already depends on these names.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix front test -- src/modules/comments/hooks/__tests__/useCommentsViewModel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/comments/hooks/useCommentsViewModel.ts front/src/modules/comments/hooks/__tests__/useCommentsViewModel.test.ts
git commit -m "test: зафиксирован контракт счетчиков comments view model"
```

### Task 2: Update table card tests and counter copy

**Files:**
- Modify: `front/src/modules/comments/components/__tests__/CommentsTableCard.test.tsx`
- Modify: `front/src/modules/comments/components/CommentsTableCard.tsx`

- [ ] **Step 1: Write failing UI tests for explicit counters**

Add tests that verify the component renders explicit counter wording instead of ambiguous `visible / total`, for example:
- total comments by server filter;
- loaded comments count;
- rendered comments count when local filters reduce the visible set.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix front test -- src/modules/comments/components/__tests__/CommentsTableCard.test.tsx`
Expected: FAIL because the current badge/footer still use ambiguous counter presentation.

- [ ] **Step 3: Implement the minimal counter UI change**

Update `front/src/modules/comments/components/CommentsTableCard.tsx` to:
- accept `renderedCount` instead of the ambiguous `visibleCount`;
- display counters with explicit labels;
- keep existing layout and grouping behavior intact.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix front test -- src/modules/comments/components/__tests__/CommentsTableCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/comments/components/CommentsTableCard.tsx front/src/modules/comments/components/__tests__/CommentsTableCard.test.tsx
git commit -m "fix: уточнено отображение счетчиков комментариев"
```

## Chunk 2: Infinite Scroll Guard

### Task 3: Reproduce multi-fire auto-load at the component boundary

**Files:**
- Modify: `front/src/modules/comments/components/__tests__/CommentsTableCard.test.tsx`
- Modify: `front/src/modules/comments/components/CommentsTableCard.tsx`

- [ ] **Step 1: Write a failing test for chained auto-load**

Add a test that simulates:
- initial render with `hasMore = true`;
- sentinel already in viewport;
- rerender after load completes while sentinel is still visible.

The expected behavior is:
- at most one automatic `onLoadMore` call for the initial fill pass;
- no second immediate call without a fresh intersection or user scroll signal.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix front test -- src/modules/comments/components/__tests__/CommentsTableCard.test.tsx`
Expected: FAIL because the current logic can call `onLoadMore` repeatedly through the timeout and observer combination.

- [ ] **Step 3: Implement the minimal load-more guard**

Update `front/src/modules/comments/components/CommentsTableCard.tsx` to add a local guard, for example:
- track whether the current render cycle already consumed its automatic fill load;
- reset that guard only after a fresh observer transition or a real user scroll;
- keep manual/infinite loading intact when the user continues scrolling down.

Avoid moving this behavior into unrelated global state unless the component test proves it is necessary.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix front test -- src/modules/comments/components/__tests__/CommentsTableCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/comments/components/CommentsTableCard.tsx front/src/modules/comments/components/__tests__/CommentsTableCard.test.tsx
git commit -m "fix: ограничена автоматическая догрузка comments"
```

## Chunk 3: Store and Query Merge Consistency

### Task 4: Lock merge behavior between background sync and loaded pages

**Files:**
- Modify: `front/src/modules/comments/hooks/__tests__/useCommentsQuery.test.ts`
- Modify: `front/src/modules/comments/hooks/useCommentsQuery.ts`

- [ ] **Step 1: Write failing tests for sync merge behavior**

Add tests that verify:
- background sync preserves already loaded extra pages;
- `nextCursor` is not nulled when extra pages still exist;
- `hasMore` remains true when the store already knows there are more pages;
- `totalCount` continues to reflect the server total instead of rendered count.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix front test -- src/modules/comments/hooks/__tests__/useCommentsQuery.test.ts`
Expected: FAIL if the current merge logic does not fully preserve the intended pagination contract.

- [ ] **Step 3: Implement the minimal merge fix**

Adjust `front/src/modules/comments/hooks/useCommentsQuery.ts` so the merge logic prefers:
- incoming server counters for global totals;
- existing loaded pages for accumulated items beyond the first page;
- existing pagination state when those extra pages imply the first-page response is incomplete.

Keep the change local to merge/query sync logic.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix front test -- src/modules/comments/hooks/__tests__/useCommentsQuery.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/comments/hooks/useCommentsQuery.ts front/src/modules/comments/hooks/__tests__/useCommentsQuery.test.ts
git commit -m "fix: стабилизировано слияние comments sync и пагинации"
```

### Task 5: Verify store state stays aligned with the new contract

**Files:**
- Modify: `front/src/modules/comments/store/__tests__/commentsStore.test.ts`
- Modify: `front/src/modules/comments/store/commentsStore.ts`

- [ ] **Step 1: Write failing store tests for loaded-vs-total behavior**

Add tests covering:
- `totalCount` remains sourced from the API response;
- `comments.length` is the loaded count and is not forced into `totalCount`;
- reset on filter change starts a fresh cursor chain cleanly.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm --prefix front test -- src/modules/comments/store/__tests__/commentsStore.test.ts`
Expected: FAIL if current store logic still mutates totals based on local list length in edge cases.

- [ ] **Step 3: Implement the minimal store adjustment**

Tighten `front/src/modules/comments/store/commentsStore.ts` so:
- server totals stay authoritative;
- any derived loaded/rendered values remain outside the server-total field;
- filter resets and cursor resets remain race-safe.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm --prefix front test -- src/modules/comments/store/__tests__/commentsStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add front/src/modules/comments/store/commentsStore.ts front/src/modules/comments/store/__tests__/commentsStore.test.ts
git commit -m "fix: выровнено состояние счетчиков comments store"
```

## Chunk 4: Verification

### Task 6: Run focused comments regression checks

**Files:**
- Modify: none

- [ ] **Step 1: Run the focused comments test set**

Run: `npm --prefix front test -- src/modules/comments/components/__tests__/CommentsTableCard.test.tsx src/modules/comments/hooks/__tests__/useCommentsViewModel.test.ts src/modules/comments/hooks/__tests__/useCommentsQuery.test.ts src/modules/comments/store/__tests__/commentsStore.test.ts`
Expected: PASS

- [ ] **Step 2: Run lint for touched comments files**

Run: `npm --prefix front run lint -- src/modules/comments/components/CommentsTableCard.tsx src/modules/comments/hooks/useCommentsViewModel.ts src/modules/comments/hooks/useCommentsQuery.ts src/modules/comments/store/commentsStore.ts`
Expected: PASS

- [ ] **Step 3: Summarize residual manual verification**

Record the remaining browser checks for a human or a later execution step:
- open comments page without search;
- confirm first render does not cascade indefinitely;
- scroll down and confirm additional pages still load;
- switch `read/unread/all` and confirm counters remain coherent.

- [ ] **Step 4: Commit final verification state**

```bash
git add .
git commit -m "test: добавлены проверки для infinite scroll comments"
```

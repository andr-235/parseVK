# Plan: Extract useTasksMutations hook

## Goal
Extract 8 mutation definitions from `TasksPage.tsx` (via `useTasksViewModel` and `tasksStore`) into a dedicated `useTasksMutations` hook, reducing page/store complexity and enabling reuse across the tasks page.

## Background
Currently, mutation logic is split across:
- **`tasksStore.ts`** — `fetchTasks`, `createParseTask`, `resumeTask`, `checkTask`, `deleteTask`, `fetchTaskDetails` (calls service → updates store → invalidates query)
- **`useTaskActions.ts`** — thin selector-only wrapper for `resumeTask`, `checkTask`, `deleteTask`
- **`useTasksViewModel.ts`** — orchestration handlers (`handleCreateTask`, `handleTaskSelect`, `handleAutomationRun`) with toast/error handling

The store handles both state AND mutations (command-query separation violation). React Query's `useMutation` is already used in `telegram-dl-upload` and `tgmbase-search` modules — this aligns with the existing pattern.

## Changes

- [x] 1. Create `useTasksMutations` hook (`front/src/modules/tasks/hooks/useTasksMutations.ts`)
  - Wrap each store mutation in React Query `useMutation`:
    1. `createTaskMutation` — `tasksService.createParsingTask` → on success: update store + invalidate query
    2. `resumeTaskMutation` — `tasksService.resumeTask` → on success: update store + invalidate query
    3. `checkTaskMutation` — `tasksService.checkTask` → on success: update store + invalidate query
    4. `deleteTaskMutation` — `tasksService.deleteTask` → on success: remove from store + invalidate query
    5. `fetchTaskDetailsMutation` — `tasksService.fetchTaskDetails` → on success: update store
    6. `createTaskAction` — wraps `createTaskMutation` with validation + toast
    7. `selectTaskAction` — wraps `fetchTaskDetailsMutation` with loading toast
    8. `runAutomationAction` — wraps `useTaskAutomationStore.runNow` with toast
  - Expose mutation states (`isPending`, `error`, etc.) and async `mutateAsync` functions
  - Handle error toasts inside the hook (consistent error handling)
- [x] 2. Update `useTaskActions.ts`
  - Delegate to `useTasksMutations` instead of directly reading from store
  - Keep as convenience wrapper for simple access to `resumeTask`, `checkTask`, `deleteTask`
- [x] 3. Update `useTasksViewModel.ts`
  - Replace direct store mutation calls with `useTasksMutations` hooks
  - Remove inline orchestration logic (`handleCreateTask`, `handleTaskSelect`, `handleAutomationRun`)
  - Use mutation states (`isCreating`, etc.) from the new hook
- [x] 4. Update `tasksStore.ts`
  - Remove mutation methods (`createParseTask`, `resumeTask`, `checkTask`, `deleteTask`, `fetchTaskDetails`) from store
  - Keep only state + derived selectors + `fetchTasks` (query trigger)
  - Update `TasksState` type in `shared/types/stores.ts`
- [x] 5. Update `shared/types/stores.ts` — `TasksState`
  - Remove `createParseTask`, `resumeTask`, `checkTask`, `deleteTask`, `fetchTaskDetails` from interface
  - Keep `taskIds`, `tasksById`, `taskDetails`, `tasks`, `isLoading`, `isCreating`, `isSocketConnected`, `fetchTasks`, `getTaskDetails`
- [x] 6. Update `front/src/modules/tasks/index.ts`
  - Export `useTasksMutations`
- [x] 7. Write tests (`front/src/modules/tasks/hooks/__tests__/useTasksMutations.test.ts`)
  - Test each mutation: success path, error path, store update on success
  - Mock `tasksService` and `useTasksStore`

## Files to create
- [x] `front/src/modules/tasks/hooks/useTasksMutations.ts`
- [x] `front/src/modules/tasks/hooks/__tests__/useTasksMutations.test.ts`

## Files to modify
- [x] `front/src/modules/tasks/hooks/useTaskActions.ts`
- [x] `front/src/modules/tasks/hooks/useTasksViewModel.ts`
- [x] `front/src/modules/tasks/store/tasksStore.ts`
- [x] `front/src/modules/tasks/index.ts`
- [x] `front/src/shared/types/stores.ts`

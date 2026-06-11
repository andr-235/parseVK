# Project Roadmap

> Refactor the tasks page to align with project conventions: decompose oversized components, eliminate inconsistencies, and add test coverage.

## Milestones

- [x] **Audit current state** — Identify all violations of project conventions (file size limits, missing hooks, missing tests, inconsistent patterns) across all 5 files in `/pages/tasks`.
- [ ] **Extract `useTasksMutations` hook** — Pull 8 mutation definitions from `TasksPage.tsx` into a dedicated hook, reducing page complexity and enabling reuse.
- [ ] **Extract `useTaskFilters` hook** — Move status filter state, filtered counts, and filter button rendering into a reusable hook/component.
- [ ] **Extract `useTaskSelection` hook** — Replace manual `Set<number>` with the shared `useSelection<number>()` hook (consistent with `AuthorsPage`).
- [ ] **Decompose `TasksPage.tsx`** — Split rendering into focused sub-components (e.g., `TaskToolbar`, `BatchActionBar`, `TaskTableArea`), bringing the file from ~396 lines to under 150.
- [ ] **Refactor `TaskRow.tsx`** — Split action button logic into a `TaskActions` sub-component and extract status badge into a shared utility; bring from ~193 lines to under 150.
- [ ] **Refactor `GroupSelectModal.tsx`** — Extract reusable `GroupSelectList` and `GroupSearchBar` components; reduce from ~205 lines to under 150.
- [ ] **Add unit tests** — Create `__tests__/` directory with tests for `TaskRow`, `CreateTaskForm`, `AutomationPanel`, and the new hooks, matching the testing pattern used by `AuthorsPage`.
- [ ] **Optimize batch delete** — Replace `Promise.all` individual deletes with a single batch endpoint call on the API layer.
- [ ] **Verify and finalize** — Run lint + typecheck + tests, confirm all files are under 150 lines, and remove any dead code or leftover imports.

## Completed

| Milestone | Date |
|-----------|------|
| Audit current state | 2026-06-11 |

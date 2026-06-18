# Implementation Plan: API Gateway Architecture Refactoring

Branch: feature/api-gateway-architecture-refactoring
Created: 2026-06-19

## Settings
- Testing: yes
- Logging: verbose
- Docs: yes
- Naming: полные понятные имена переменных (без сокращений)

---

## Commit Plan
- **Commit 1** (Tasks 1-5): `refactor(api-gateway): add domain exceptions and fix base service layer`
- **Commit 2** (Tasks 6-9): `fix(api-gateway): fix error handling, user_id, and package structure`
- **Commit 3** (Tasks 10-13): `refactor(api-gateway): refactor content module - extract mappers, fix layering`
- **Commit 4** (Tasks 14-16): `refactor(api-gateway): refactor comments and friends_export modules`
- **Commit 5** (Tasks 17-19): `refactor(api-gateway): refactor remaining modules`
- **Commit 6** (Tasks 20-21): `test(api-gateway): add tests for all refactored layers`
- **Commit 7** (Tasks 22-23): `docs(api-gateway): update architecture documentation`

---

## Phase 1: Foundation — Исправление базового слоя

- [x] Task 1: Create domain exception layer
- [x] Task 2: Refactor BaseGatewayService
- [x] Task 3: Add async context manager to clients
- [x] Task 4: Fix HTTP connection leaks (per-request approach)
- [x] Task 5: Standardize error codes
<!-- Commit checkpoint: tasks 1-5 -->

## Phase 2: Infrastructure layer

- [x] Task 6: Fix `user_id=""` → `None`
- [x] Task 7: Add `vk_service/__init__.py` + clean orphaned `__pycache__`
- [x] Task 8: Split `internal.py` (158 → 2 files)
- [x] Task 9: Fix `except Exception:` patterns
<!-- Commit checkpoint: tasks 6-9 -->

## Phase 3: Module refactoring — content

- [ ] Task 10: Create ContentServiceClient (thin HTTP wrapper)
- [ ] Task 11: Extract mappers for content module
- [ ] Task 12: Move business logic from groups_router to service
- [ ] Task 13: Fix content service — remove Request, use domain exceptions
<!-- Commit checkpoint: tasks 10-13 -->

## Phase 4: Module refactoring — comments + friends_export

- [ ] Task 14: Refactor comments service
- [ ] Task 15: Refactor friends_export — split provider_adapter
- [ ] Task 16: Refactor friends_export service
<!-- Commit checkpoint: tasks 14-16 -->

## Phase 5: Module refactoring — remaining

- [ ] Task 17: Refactor listings service
- [ ] Task 18: Refactor telegram_tgmbase service
- [ ] Task 19: Refactor remaining small modules
<!-- Commit checkpoint: tasks 17-19 -->

## Phase 6: Tests

- [ ] Task 20: Tests for foundation layer
- [ ] Task 21: Tests for refactored modules
<!-- Commit checkpoint: tasks 20-21 -->

## Phase 7: Polish + docs

- [ ] Task 22: Add `from __future__ import annotations` + verify
- [ ] Task 23: Update documentation
<!-- Commit checkpoint: tasks 22-23 -->

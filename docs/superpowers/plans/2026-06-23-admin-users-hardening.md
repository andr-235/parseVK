# Admin Users Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver production-ready admin user management with persistent temporary-password state, protected administrator invariants, scalable listing, and a maintainable frontend.

**Architecture:** Extend identity-service as the source of truth, forward the typed contract through api-gateway, and keep the React page as orchestration over focused hooks/components. Implement each contract change test-first and ship the backend/frontend transition atomically.

**Tech Stack:** FastAPI, Pydantic v2, SQLAlchemy 2 async, Alembic, React 19, TypeScript 6, TanStack Query 5, Vitest.

---

### Task 1: Persist temporary-password state

**Files:**
- Create: `services/identity-service/alembic/versions/20260623_0003_add_temporary_password_state.py`
- Modify: `services/identity-service/app/db/models.py`
- Modify: `services/identity-service/app/modules/auth/service.py`
- Modify: `services/identity-service/app/modules/users/service.py`
- Test: `services/identity-service/tests/test_auth_service.py`
- Test: `services/identity-service/tests/test_users_service.py`

- [ ] Add failing tests proving admin reset sets `is_temporary_password`, revokes sessions, and user password change clears the flag.
- [ ] Run focused tests and confirm expected failures.
- [ ] Add the additive migration and model field.
- [ ] Update both services transactionally without logging credentials.
- [ ] Run focused tests and commit.

### Task 2: Harden admin schemas and invariants

**Files:**
- Modify: `services/identity-service/app/modules/users/schemas.py`
- Modify: `services/identity-service/app/modules/users/repository.py`
- Modify: `services/identity-service/app/modules/users/service.py`
- Modify: `services/identity-service/app/modules/users/admin_router.py`
- Test: `services/identity-service/tests/test_users_service.py`
- Test: `services/identity-service/tests/test_admin_users_api.py`

- [ ] Add failing tests for role/password/username validation and last-active-admin delete, demotion, and deactivation conflicts.
- [ ] Add strict enums and bounded request/query schemas.
- [ ] Add repository locking/counting primitives and service invariant checks.
- [ ] Return persisted password state in responses.
- [ ] Run identity-service tests and commit.

### Task 3: Add scalable list contract

**Files:**
- Modify: `services/identity-service/app/modules/users/schemas.py`
- Modify: `services/identity-service/app/modules/users/repository.py`
- Modify: `services/identity-service/app/modules/users/service.py`
- Modify: `services/identity-service/app/modules/users/admin_router.py`
- Test: `services/identity-service/tests/test_users_service.py`
- Test: `services/identity-service/tests/test_admin_users_api.py`

- [ ] Add failing tests for pagination metadata, search, filters, stable sorting, and invalid query values.
- [ ] Implement repository count/list query with deterministic `id` tie-breaker.
- [ ] Return `items`, `page`, `pageSize`, `total`, and `totalPages`.
- [ ] Run focused and full identity-service tests and commit.

### Task 4: Align gateway contract

**Files:**
- Create: `services/api-gateway/app/modules/admin_users/dependencies.py`
- Modify: `services/api-gateway/app/modules/admin_users/service.py`
- Modify: `services/api-gateway/app/modules/admin_users/router.py`
- Test: `services/api-gateway/tests/test_admin_users.py`

- [ ] Add failing forwarding and authorization tests.
- [ ] Move the service factory to `dependencies.py`.
- [ ] Forward typed query parameters and preserve structured errors.
- [ ] Run api-gateway tests and commit.

### Task 5: Align frontend API and route authorization

**Files:**
- Modify: `front/src/shared/api/admin-users.ts`
- Modify: `front/src/shared/api/__tests__/admin-users.test.ts`
- Modify: `front/src/App.tsx`
- Test: `front/src/__tests__/App.test.tsx`

- [ ] Add failing tests for paginated mapping, query parameters, password response, and non-admin route rejection.
- [ ] Add strict `UserRole`, query, pagination, and password response types.
- [ ] Add an admin-only outlet/route guard.
- [ ] Run focused tests and commit.

### Task 6: Decompose and complete the admin users UI

**Files:**
- Modify: `front/src/pages/admin-users/AdminUsersPage.tsx`
- Create: `front/src/pages/admin-users/adminUsersColumns.ts`
- Create: `front/src/pages/admin-users/useAdminUsers.ts`
- Create: `front/src/pages/admin-users/AdminUsersToolbar.tsx`
- Create: `front/src/pages/admin-users/CreateUserRow.tsx`
- Create: `front/src/pages/admin-users/EditUserRow.tsx`
- Create: `front/src/pages/admin-users/UserRow.tsx`
- Create: `front/src/pages/admin-users/TemporaryPasswordBanner.tsx`
- Create: `front/src/pages/admin-users/AdminUsersTable.tsx`
- Modify: `front/src/pages/admin-users/__tests__/AdminUsersPage.test.tsx`

- [ ] Add failing page tests for reset disclosure, server query changes, mutation errors, pagination, and exact table structure.
- [ ] Implement the query hook and mutation invalidation using real query parameters.
- [ ] Split forms, rows, toolbar, disclosure, and table states into focused files.
- [ ] Keep responsive header/body visibility aligned and files at or below 150 lines.
- [ ] Run focused frontend tests and commit.

### Task 7: Documentation and final verification

**Files:**
- Modify: `docs/api.md`
- Create: `.ai-factory/patches/2026-06-23-<time>.md`

- [ ] Document list query parameters, paginated response, invariants, and password responses.
- [ ] Run `uv run pytest tests/ -v` in identity-service and api-gateway.
- [ ] Run frontend test, build, and lint commands.
- [ ] Run `git diff --check`, file-size checks, and a secret scan.
- [ ] Create the required learning patch and commit all remaining changes.

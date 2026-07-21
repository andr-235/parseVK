# Implementation Plan: Migration Repair for PR-B

Branch: none (fast mode)
Created: 2026-07-21

## Settings
- Testing: yes
- Logging: verbose
- Docs: yes

## Roadmap Linkage
Milestone: "EDA Hardening & Shared Schemas"
Rationale: Migration-repair fixes Alembic graph integrity and schema drift — part of infrastructure hardening for reliable deployments.

## Research Context
Source: .ai-factory/RESEARCH.md (Active Summary, Updated: 2026-07-21 16:00, SHA256: 5cb4f29bec4cdecfea3d9ce965654a4b26cc319956239826589b96742eb7d42d)

Topic: PR-B — Critical schema drift found. Migration-repair required before closure.

Goal: Complete PR-B (ownership cleanup). DB verification exposed critical issues — PR-B is NOT complete.

DB verification results (2026-07-21, server deployer@192.168.88.12):

| Check | Result | Status |
|-------|--------|--------|
| Docker containers | All 25 UP, healthy | ✅ |
| content-service alembic head | `f7c1b2d3e4a5` (merge) | ✅ |
| im-service alembic head | `pr5_unify_consumer_name_im` | ✅ |
| content-service `monitoring_groups` table | EXISTS, 74 rows | ⚠️ awaiting DROP |
| im-service `monitoring_groups` table | EXISTS, 74 rows, data IDENTICAL to content | ✅ |
| im-service `im_group_id` column | ❌ DOES NOT EXIST in production schema | 🔴 CRITICAL |
| im-service alembic chain `20260720_0001→0002→0003` | NOT APPLIED (fork from `20260626_0004`) | 🔴 CRITICAL |
| content-service revision ID | `20260720_0001_drop_monitoring_groups` = 35 chars (> 32 max) | ⚠️ needs fix |

Critical schema drift:
- im-service ORM model requires `im_group_id: Mapped[int] = mapped_column(ForeignKey("im_groups.id"), unique=True, nullable=False)`
- Production DB has NO `im_group_id` column → any ORM CRUD operation on MonitoringGroup will FAIL
- Alembic fork: `20260720_0001` and `pr5_unify_consumer_name_im` share parent `20260626_0004` → two-branch graph
- ETL used raw SQL without `im_group_id`, so 74 rows migrated successfully despite schema mismatch

Required fixes (in ORDER):

1. **Линеаризовать Alembic граф**:
   - Изменить `down_revision` в `20260720_0001_add_im_group_id_to_monitoring_groups.py` с `"20260626_0004"` на `"pr5_unify_consumer_name_im"`
   - Итог: `20260626_0004 → pr5_unify_consumer_name_im → 20260720_0001 → 0002 → 0003`

2. **Сократить content-service revision ID**:
   - `20260720_0001_drop_monitoring_groups` (35 chars) → `20260720_drop_monitoring_groups` (31 chars)
   - Переименовать файл миграции, обновить revision внутри

3. **Улучшить rollback-маркировку backfill**:
   - Добавить `raw = {"origin": "monitoring_group_backfill", "monitoring_group_id": mg.id}` в stub ImGroup
   - Иначе после отката `0001` stub-ы неотличимы от настоящих чатов

4. **Staged production rollout**:
   - `alembic upgrade 20260720_0001` (добавить nullable im_group_id + FK + UNIQUE)
   - `python scripts/backfill_im_group_id.py --dry-run`
   - `python scripts/backfill_im_group_id.py --commit`
   - SQL verification (null_links=0, orphan_links=0, duplicates=0)
   - `alembic upgrade 20260720_0003` (SET NOT NULL + indexes)
   - CRUD smoke-test via API
   - `alembic upgrade 20260720_drop_monitoring_groups` in content-service (только после зелёных проверок)

5. **Pre-backfill: валидация**:
   - Запустить `scripts/validate_alembic_graphs.py` после исправления графа
   - Убедиться, что `alembic heads` показывает один head

Open questions:
- Есть ли другие окружения (staging), где `20260720_0001` могла быть применена?
- Запущен ли `validate_alembic_graphs.py` в CI?

## Tasks

### Phase 1: Fix Alembic Graph in im-service
- [x] Task 1: Linearize im-service Alembic migration graph
  - **File:** `services/im-service/alembic/versions/20260720_0001_add_im_group_id_to_monitoring_groups.py`
  - **Action:** Change `down_revision` from `"20260626_0004"` to `"pr5_unify_consumer_name_im"`
  - **Validation:** Verify `alembic heads` returns exactly one head (`20260720_0003`)
  - **Logging:** Log old down_revision and new down_revision at INFO level. Log head count after fix.
  - **Test:** Write a test that checks the revision chain is linear and ends at one head.

### Phase 2: Fix content-service Revision ID
- [ ] Task 2: Shorten content-service migration revision ID
  - **File:** `services/content-service/alembic/versions/20260720_0001_drop_monitoring_groups.py`
  - **Action:** Rename file to `20260720_drop_monitoring_groups.py`, update `revision` string inside from `"20260720_0001_drop_monitoring_groups"` to `"20260720_drop_monitoring_groups"`
  - **Validation:** Verify all references match the new revision ID
  - **Logging:** Log old and new revision ID at INFO level
  - **Risk:** This is a published migration on the merge head — coordinate with team on timing

### Phase 3: Add Rollback Marker to Backfill
- [ ] Task 3: Add origin marker to stub ImGroup creation in backfill script
  - **File:** `services/im-service/scripts/backfill_im_group_id.py`
  - **Action:** When creating stub ImGroup for unmatched MonitoringGroup, add `raw={"origin": "monitoring_group_backfill", "monitoring_group_id": mg.id}`
  - **Validation:** Verify stub ImGroup records are distinguishable from real ones after downgrade
  - **Logging:** Log stub creation with origin marker at INFO level

### Phase 4: CI Validation Script
- [ ] Task 4: Create `validate_alembic_graphs.py` script
  - **File (new):** `services/im-service/scripts/validate_alembic_graphs.py`
  - **Action:** Script that runs `alembic heads` and asserts exactly one head. Fail with non-zero exit code if multiple heads detected
  - **Logging:** Print head count and head revision IDs. ERROR if multiple heads.
  - **Validation:** Run after Task 1 — should pass with single head

### Phase 5: Tests
- [ ] Task 5: Write tests for im-service migration linearization
  - **Files:** `services/im-service/tests/test_migrations.py` (new)
  - **Content:** Test that revision chain is linear, test head count, test upgrade/downgrade round-trip for 20260720 chain
  - **Dependencies:** Task 1 must be complete
- [ ] Task 6: Write tests for content-service revision ID fix
  - **Files:** `services/content-service/tests/test_migrations.py` (new)
  - **Content:** Test that revision ID is <= 32 chars, test upgrade consistency
  - **Dependencies:** Task 2 must be complete

### Phase 6: Rollout Documentation
- [ ] Task 7: Document staged production rollout sequence
  - **File:** `services/im-service/docs/migration-repair-rollout.md` (new) or add to PR description
  - **Content:** Exact production deployment sequence with verification steps at each stage
  - Include: pre-flight checks, dry-run, commit, verification, smoke-test
  - Include: rollback procedure with stub identification

## Commit Plan
- **Commit 1** (tasks 1-2): "fix: linearize im-service Alembic graph and shorten content-service revision ID"
- **Commit 2** (tasks 3-4): "fix: add rollback marker to backfill and create alembic validation script"
- **Commit 3** (tasks 5-6): "test: add migration tests for both services"
- **Commit 4** (task 7): "docs: document staged rollout procedure for PR-B migration-repair"

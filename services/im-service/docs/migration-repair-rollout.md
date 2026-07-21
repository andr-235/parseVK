# Staged Production Rollout — PR-B Migration Repair

**Date:** 2026-07-21
**Server:** deployer@192.168.88.12
**Services affected:** `im-service` (im-db), `content-service` (content-db)
**Alembic chain (im-service):** `20260626_0004 → pr5_unify_consumer_name_im → 20260720_0001 → 20260720_0002 → 20260720_0003`
**Alembic chain (content-service):** `f7c1b2d3e4a5 → 20260720_drop_monitoring_groups`

> **Critical prerequisite:** The Alembic graph has been linearized (Task 1),
> content-service revision ID has been shortened (Task 2), and backfill script
> includes the `raw.origin` rollback marker (Task 3). All three fixes **must**
> be merged and deployed **before** this rollout sequence is executed.

---

## Phase 1: Pre-flight Checks

All commands run on the deploy server (`deployer@192.168.88.12`) inside
the respective service container or with `docker exec`.

### 1.1 — Verify alembic graph (im-service)

```bash
cd /app/services/im-service
alembic heads
```

**Expected output:** a single head — `20260720_0003`

If more than one head appears — **STOP**. The graph is not linearized.
Re-run Task 1 first.

### 1.2 — Validate alembic graph with script

```bash
python scripts/validate_alembic_graphs.py
```

**Expected exit code:** `0`

**Expected log:**
```
INFO - Alembic graph validation PASSED: exactly 1 head — 20260720_0003
```

If the script exits with code `1` — **STOP**. Investigate the graph.

### 1.3 — Validate alembic graph (content-service)

```bash
cd /app/services/content-service
alembic heads
```

**Expected output:** a single head — `20260720_drop_monitoring_groups`

### 1.4 — Take database snapshots / backups

```bash
# im-db
pg_dump -h im-db -U im --format=custom -f /tmp/backup_im_pre_migration_$(date +%Y%m%d_%H%M%S).dump im

# content-db
pg_dump -h content-db -U content --format=custom -f /tmp/backup_content_pre_migration_$(date +%Y%m%d_%H%M%S).dump content
```

Store the dump files outside the container (e.g., a persistent volume or
object storage). Note the backup paths in the deployment log.

### 1.5 — Verify no active connections to im-db and content-db

```sql
-- im-db
SELECT count(*) FROM pg_stat_activity WHERE datname = 'im' AND state = 'active';

-- content-db
SELECT count(*) FROM pg_stat_activity WHERE datname = 'content' AND state = 'active';
```

Ideally zero active connections besides your own session. If application
connections are active, schedule a maintenance window or temporarily
quiesce the services.

### 1.6 — Verify current schema state

```sql
-- im-db: confirm im_group_id is MISSING (pre-migration baseline)
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'monitoring_groups'
  AND column_name = 'im_group_id';
```

**Expected:** zero rows (column does not exist yet).

```sql
-- im-db: confirm 74 monitoring_groups exist
SELECT count(*) FROM monitoring_groups;
```

---

## Phase 2: Apply im-service Migration 0001

Migration `20260720_0001` adds a **nullable** `im_group_id` column with
a foreign key to `im_groups(id)` and a unique constraint.

### 2.1 — Run the migration

```bash
cd /app/services/im-service
alembic upgrade 20260720_0001
```

**Expected log (alembic):**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade pr5_unify_consumer_name_im -> 20260720_0001
```

### 2.2 — Verify column was added

```sql
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'monitoring_groups'
  AND column_name = 'im_group_id';
```

**Expected:**

| column_name  | is_nullable | data_type |
|--------------|-------------|-----------|
| im_group_id  | YES         | bigint    |

### 2.3 — Verify FK constraint exists

```sql
SELECT con.conname AS constraint_name,
       con.contype AS constraint_type
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'monitoring_groups'
  AND con.conname = 'fk_monitoring_groups_im_group_id';
```

**Expected:** one row with `constraint_type = 'f'` (foreign key).

### 2.4 — Verify unique constraint exists

```sql
SELECT con.conname AS constraint_name,
       con.contype AS constraint_type
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'monitoring_groups'
  AND con.conname = 'uq_monitoring_groups_im_group_id';
```

**Expected:** one row with `constraint_type = 'u'` (unique).

### 2.5 — Verify all rows have NULL im_group_id (expected before backfill)

```sql
SELECT count(*) FROM monitoring_groups WHERE im_group_id IS NULL;
```

**Expected:** `74` (all existing rows).

---

## Phase 3: Backfill `im_group_id`

### 3.1 — Dry run (preview)

```bash
cd /app/services/im-service
python scripts/backfill_im_group_id.py --dry-run
```

**Expected behavior:** prints a log line for each MonitoringGroup row.
Groups that have a matching ImGroup (by `messenger` + `chat_id`) will show
`matched`; unmatched groups will show `[DRY-RUN] would create stub`.

**Review the output carefully.** The summary line should look like:

```
[DRY-RUN] Would resolve 74 rows and create 0 stub ImGroups; no changes committed.
```

If the count is not 74 rows resolved, or if stub creation is unexpected,
investigate before proceeding.

### 3.2 — Commit

```bash
cd /app/services/im-service
python scripts/backfill_im_group_id.py --commit
```

**Expected log (summary line):**
```
Backfill committing: resolved 74 rows, created 0 stub ImGroups, 0 errors.
```

> **Note:** All 74 rows should be matched because the ETL already
> created corresponding ImGroup rows for every MonitoringGroup.
> Stub creation count = 0 is the expected healthy case.

The script automatically runs `verify_no_nulls` after the commit:
```
Backfill verification passed: no NULL im_group_id rows remain.
```

### 3.3 — Verification queries

Run all three checks:

```sql
-- 3.3.1: Null links = 0
SELECT COUNT(*) AS null_links
FROM monitoring_groups
WHERE im_group_id IS NULL;
```

**Expected:** `0`

```sql
-- 3.3.2: Orphan links = 0 (im_group_id points to non-existent ImGroup)
SELECT COUNT(*) AS orphan_links
FROM monitoring_groups mg
LEFT JOIN im_groups ig ON mg.im_group_id = ig.id
WHERE ig.id IS NULL
  AND mg.im_group_id IS NOT NULL;
```

**Expected:** `0`

```sql
-- 3.3.3: Duplicates = 0 (im_group_id should be unique)
SELECT im_group_id, COUNT(*) AS dup_count
FROM monitoring_groups
GROUP BY im_group_id
HAVING COUNT(*) > 1;
```

**Expected:** zero rows

---

## Phase 4: Apply im-service Migrations 0002–0003

### 4.1 — Run migrations 0002 + 0003

Migration `20260720_0002` validates no NULLs remain, then sets
`im_group_id` to `NOT NULL`. Migration `20260720_0003` adds indexes
on `messenger` and `category`.

```bash
cd /app/services/im-service
alembic upgrade 20260720_0003
```

This applies both 0002 and 0003 in sequence (0002 first, then 0003).

**Expected log:**
```
INFO  [alembic.runtime.migration] Running upgrade 20260720_0001 -> 20260720_0002
INFO  [alembic.runtime.migration] Running upgrade 20260720_0002 -> 20260720_0003
```

If migration 0002 fails with:
```
Exception: Cannot SET NOT NULL: N rows have NULL im_group_id. Run backfill script first.
```

→ **STOP.** Go back to Phase 3. The backfill was incomplete.

### 4.2 — Verify NOT NULL

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'monitoring_groups'
  AND column_name = 'im_group_id';
```

**Expected:**

| column_name  | is_nullable |
|--------------|-------------|
| im_group_id  | NO          |

### 4.3 — Verify indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'monitoring_groups'
  AND indexname IN ('ix_monitoring_groups_messenger', 'ix_monitoring_groups_category');
```

**Expected:** two indexes present.

### 4.4 — CRUD smoke test via API

```bash
# List all monitoring groups
curl -s http://localhost:8001/api/v1/im/groups | python -c "import sys,json; data=json.load(sys.stdin); print(f'Count: {len(data)}')"
```

**Expected:** `Count: 74`

```bash
# Get a single group (replace <id> with an actual id from the list)
curl -s http://localhost:8001/api/v1/im/groups/1 | python -c "import sys,json; data=json.load(sys.stdin); print(f'id={data.get(\"id\")}, name={data.get(\"name\")}')"
```

**Expected:** returns valid group data with `im_group_id` populated.

If the API returns 500 errors — **STOP.** The schema drift is not fully
resolved. Check the ORM model matches the DB schema.

---

## Phase 5: Apply content-service DROP TABLE

**Proceed only after ALL Phase 1–4 verifications are GREEN.**

### 5.1 — Run the DROP TABLE migration

```bash
cd /app/services/content-service
alembic upgrade 20260720_drop_monitoring_groups
```

**Expected log:**
```
INFO  [alembic.runtime.migration] Running upgrade f7c1b2d3e4a5 -> 20260720_drop_monitoring_groups
```

### 5.2 — Verify table removed

```sql
-- content-db
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'monitoring_groups'
);
```

**Expected:** `false` (table no longer exists).

```bash
# Also via psql
psql -h content-db -U content -d content -c '\dt monitoring_groups'
```

**Expected:** `Did not find any relation named "monitoring_groups".`

### 5.3 — Final alembic head verification

```bash
cd /app/services/content-service
alembic heads
```

**Expected:** single head `20260720_drop_monitoring_groups`

---

## Rollback Procedure

### When to roll back

Roll back if any verification step in Phases 2–5 produces unexpected
results. The sequence is designed to be safe — each phase is verified
before the next begins.

### Full rollback sequence

Execute in **reverse order** of the forward deployment:

```bash
# 1. content-service: recreate monitoring_groups table
cd /app/services/content-service
alembic downgrade 20260720_drop_monitoring_groups
# → reverts to f7c1b2d3e4a5

# 2. im-service: remove indexes and make im_group_id nullable again
cd /app/services/im-service
alembic downgrade 20260720_0003
# → reverts to 20260720_0002 (drops indexes, im_group_id stays NOT NULL)

alembic downgrade 20260720_0002
# → reverts to 20260720_0001 (makes im_group_id nullable again)

# 3. im-service: remove im_group_id column, FK, and unique constraint
alembic downgrade 20260720_0001
# → reverts to pr5_unify_consumer_name_im (column + FK + UNIQUE removed)
```

### Post-rollback: Identify backfill-created stubs

After downgrading `20260720_0001`, the `im_group_id` column is gone,
but any stub `ImGroup` rows created during backfill **remain** in
`im_groups`. Identify them via the `raw.origin` marker:

```sql
-- im-db
SELECT id, messenger, external_chat_id, raw
FROM im_groups
WHERE raw->>'origin' = 'monitoring_group_backfill';
```

**Expected (if backfill created stubs):**

| id  | messenger | external_chat_id | raw                                                               |
|-----|-----------|------------------|-------------------------------------------------------------------|
| 101 | whatsapp  | "1234567890"     | {"origin": "monitoring_group_backfill", "monitoring_group_id": 5} |
| ... |           |                  |                                                                   |

These stubs can be safely deleted if cleanup is needed:

```sql
DELETE FROM im_groups
WHERE raw->>'origin' = 'monitoring_group_backfill';
```

> **Note:** If the backfill matched all 74 rows to existing ImGroups
> (stub_created = 0), there will be no rows with this origin marker.
> This is the expected healthy case. The marker is a safety net for
> edge cases where stubs were created.

### Rollback completion checklist

- [ ] content-db: `monitoring_groups` table exists again
- [ ] im-db: `im_group_id` column removed from `monitoring_groups`
- [ ] im-db: stub ImGroups identified and cleaned (if any)
- [ ] `alembic heads` shows exactly one head in both services
- [ ] Application starts without ORM errors

---

## Verification SQL Queries (Reference)

### Phase 2 — After migration 0001 applied

```sql
-- Column exists, nullable, bigint
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'monitoring_groups'
  AND column_name = 'im_group_id';

-- FK constraint present
SELECT conname FROM pg_constraint
WHERE conrelid = 'monitoring_groups'::regclass
  AND contype = 'f';

-- UNIQUE constraint present
SELECT conname FROM pg_constraint
WHERE conrelid = 'monitoring_groups'::regclass
  AND contype = 'u';
```

### Phase 3 — After backfill

```sql
-- No NULL links
SELECT COUNT(*) AS null_links
FROM monitoring_groups WHERE im_group_id IS NULL;

-- No orphan links
SELECT COUNT(*) AS orphan_links
FROM monitoring_groups mg
LEFT JOIN im_groups ig ON mg.im_group_id = ig.id
WHERE ig.id IS NULL AND mg.im_group_id IS NOT NULL;

-- No duplicate im_group_id
SELECT im_group_id, COUNT(*) AS dup_count
FROM monitoring_groups
GROUP BY im_group_id
HAVING COUNT(*) > 1;
```

### Phase 4 — After migrations 0002+0003

```sql
-- NOT NULL verified
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'monitoring_groups'
  AND column_name = 'im_group_id';

-- Indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'monitoring_groups'
  AND indexname IN ('ix_monitoring_groups_messenger', 'ix_monitoring_groups_category');
```

### Phase 5 — After DROP TABLE

```sql
-- Table does not exist
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'monitoring_groups'
);
```

### Rollback — Stub identification

```sql
-- Find backfill-created stub ImGroups
SELECT id, messenger, external_chat_id, raw
FROM im_groups
WHERE raw->>'origin' = 'monitoring_group_backfill';

-- Delete stubs (if needed)
DELETE FROM im_groups
WHERE raw->>'origin' = 'monitoring_group_backfill';
```

---

## Notes

- **`raw` origin marker:** The backfill script sets
  `raw = {"origin": "monitoring_group_backfill", "monitoring_group_id": <id>}`
  on any newly created stub `ImGroup` record. This distinguishes stubs
  from real `ImGroups` during rollback cleanup.
- **No data loss risk:** The 74 rows are already migrated via ETL and
  exist in both `content-service.monitoring_groups` and
  `im-service.monitoring_groups`. The backfill only creates FK links;
  it does not duplicate or destroy data.
- **Stub creation edge case:** If a MonitoringGroup has no matching
  ImGroup (by `messenger` + `chat_id`), the backfill creates a stub.
  In the current production state this should not happen because the ETL
  already created matching ImGroups. Stub creation count = 0 is the
  expected healthy case.
- **Backup retention:** Keep the pre-migration dumps for at least one
  full production cycle (7 days) before deleting.

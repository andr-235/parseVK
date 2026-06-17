# Cleanup: Remove old monolithic NestJS/Node.js/Prisma legacy

**Branch:** `feature/cleanup-old-monolith-legacy`
**Created:** 2026-06-17
**Type:** refactor

## Settings

| Setting | Value |
|---------|-------|
| Testing | Yes — verify build and CI after cleanup |
| Logging | Verbose — detailed DEBUG logs for each removal step |
| Docs | Yes — mandatory docs checkpoint at completion |

## Roadmap Linkage

Milestone: `none` (not linked to any specific milestone)
Rationale: Skipped by user

## Tasks

### Phase 1 — Remove old monolith source code

#### ✅ Task 1: Delete `api/` directory

- **Deliverable:** Entire `api/` directory removed from git and disk
- **What to delete:** `api/` (node_modules, dist, coverage — all dead artifacts from old NestJS monolith)
- **Validation:** `git rm -r api/` then verify no remaining references
- **Logging:** Log total size removed and file count
- **Risk:** None — no active service depends on it

#### ✅ Task 2: Delete `scripts/backfill_watchlist.py`

- **Deliverable:** File removed
- **What to delete:** `scripts/backfill_watchlist.py`
- **Validation:** `git rm scripts/backfill_watchlist.py`
- **Logging:** Confirm removal
- **Risk:** None — one-time migration script

### Phase 2 — Remove old database infrastructure

#### ✅ Task 3: Remove `db` and `db_backup` services from docker-compose.yml

- **Deliverable:** Clean docker-compose.yml without legacy services
- **What to change:**
  - Remove `db:` service block (lines 64-85)
  - Remove `db_backup:` service block (lines 517-544)
  - Remove `postgres_data:` volume entry (lines 710-712)
- **Validation:** `docker compose config` passes without errors
- **Logging:** Log removed blocks
- **Risk:** Low — no microservice connects to `db`

#### ✅ Task 4: Delete `docker/db-backup/` directory

- **Deliverable:** Directory and all files removed
- **What to delete:** `docker/db-backup/Dockerfile`, `docker/db-backup/backup.sh`, `docker/db-backup/entrypoint.sh`
- **Validation:** `git rm -r docker/db-backup/`
- **Logging:** Confirm all 3 files removed

### Phase 3 — Clean up configuration files

#### ✅ Task 5: Update `.env.example` — remove old DATABASE section

- **Deliverable:** Clean `.env.example` without legacy `POSTGRES_*` / `DATABASE_URL`
- **What to change:** Remove lines 7-13 (`# DATABASE (PostgreSQL)` section)
- **Validation:** No references to `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL` in `.env.example`
- **Logging:** Confirm removal

#### ✅ Task 6: Update `.env.production.example` — remove old DATABASE section and PORT=3000

- **Deliverable:** Clean `.env.production.example`
- **What to change:**
  - Remove `POSTGRES_DB=vk_api`, `DATABASE_URL` section
  - Remove `PORT=3000` line (old NestJS port)
- **Validation:** No legacy entries remain
- **Logging:** Confirm removal

#### ✅ Task 7: Update `docker/frontend.nginx.conf` — remove NestJS fallback routes

- **Deliverable:** Clean nginx config without old monolith proxy routes
- **What to change:**
  - Remove line 11: `set $api_upstream ${API_URL};`
  - Remove line 13: `set $socket_io_upstream ${API_URL}/socket.io/;`
  - Remove location block for `/api/` (lines 127-136)
  - Remove location block for `/socket.io/` (lines 139-151)
- **Validation:** All requests go through `$gateway_upstream` only
- **Logging:** Confirm removed blocks

#### ✅ Task 8: Update `.lintstagedrc.js` — remove `api/**/*.ts` block

- **Deliverable:** Clean lint-staged config without old monolith patterns
- **What to change:** Remove lines 14-23 (`'api/**/*.ts': ...` block)
- **Validation:** No `api/` references in config
- **Logging:** Confirm removal

### Phase 4 — Fix CI/CD and scripts

#### ✅ Task 9: Fix `.github/workflows/ci.yml` — remove broken `go:` job

- **Deliverable:** Clean CI workflow without broken Go job
- **What to change:** Remove `go:` job (lines 92-109)
- **Details:** The `go:` job is broken — references `needs.changes.outputs.go_cli` which doesn't exist, sets up Bun but should use Go, and runs frontend tests instead of Go tests
- **Validation:** CI yaml parses correctly
- **Logging:** Confirm job removal

#### ✅ Task 10: Fix `.github/scripts/smoke-tests.sh` — remove `test_database()` function

- **Deliverable:** Clean smoke test script without old `db` service checks
- **What to change:** Remove `test_database()` function (lines 54-72) and its call in `main()` (line 145)
- **Validation:** Script runs without references to old `db` container
- **Logging:** Confirm function removal

### Phase 5 — Update documentation

#### ✅ Task 11: Update `README.md` — remove legacy volume creation command

- **Deliverable:** Clean README
- **What to change:** Remove line 9: `docker volume create parsevk_postgres_data`
- **Validation:** Quick start works without old volume
- **Logging:** Confirm removal

#### ✅ Task 12: Update `INSTRUCTIONS.md` — fix DB list, remove legacy commands

- **Deliverable:** Clean INSTRUCTIONS.md
- **What to change:**
  - Line 21: Change `6 отдельных баз (vk_api, identity, tasks, vk, content, moderation, im)` — remove `vk_api` from list, fix count (7 bases)
  - Line 44: Remove `docker volume create parsevk_postgres_data`
- **Validation:** No old monolith references remain
- **Logging:** Confirm changes

#### ✅ Task 13: Update `docs/deploy-runbook.md` — remove old volume reference

- **Deliverable:** Clean deploy runbook
- **What to change:** Line 51: remove `- **Volume missing** → docker volume create parsevk_postgres_data`
- **Validation:** No old volume references
- **Logging:** Confirm removal

## Commit Plan

| Commit # | Tasks | Message |
|----------|-------|---------|
| 1 | 1, 2 | `refactor: remove old NestJS monolith source code (api/ and legacy scripts)` |
| 2 | 3, 4 | `refactor: remove legacy database services (db, db_backup) from docker-compose` |
| 3 | 5, 6, 7, 8 | `refactor: clean up configuration files from old monolith` |
| 4 | 9, 10 | `fix(ci): remove broken go job and legacy smoke tests` |
| 5 | 11, 12, 13 | `docs: update documentation after legacy cleanup` |

## Next Steps

After plan review, run:

```
/aif-implement

CONTEXT FROM /aif-plan:
- Plan file: .ai-factory/plans/feature-cleanup-old-monolith-legacy.md
- Testing: yes
- Logging: verbose
- Docs: yes
```

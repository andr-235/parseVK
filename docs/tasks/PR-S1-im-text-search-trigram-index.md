# PR-S1 — IM text search trigram index

## Objective

Add a trigram GIN index on `content-db.im_messages.text` to eliminate sequential scans in ILIKE search queries. Current baseline shows 21–38 second latency for any text search.

## Scope

1. `CREATE EXTENSION IF NOT EXISTS pg_trgm` in content-db
2. `CREATE INDEX CONCURRENTLY ix_im_messages_text_trgm ON im_messages USING gin (text gin_trgm_ops)`
3. Alembic migration using `autocommit_block()` (CREATE INDEX CONCURRENTLY cannot run inside a transaction)
4. Migration tests
5. Repository tests verifying index usage
6. Production rollout without locking writes
7. Repeat the same baseline matrix after index creation
8. Before/after report with EXPLAIN ANALYZE and buffers

## Out of scope

- COUNT(*) changes (PR-S2)
- Keyset pagination (PR-S3)
- Any query or code changes in search service

## Preconditions

- [ ] Baseline results captured in `docs/research/search-performance-baseline-results.md`
- [ ] All 6 EXPLAIN ANALYZE plans recorded (absent, rare, frequent, COUNT, deep OFFSET, keyword batch)
- [ ] content-db.im_messages has ~131k rows

## Migration

```python
# In content-service migration
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    with op.get_context().autocommit_block():
        op.execute(
            "CREATE INDEX CONCURRENTLY ix_im_messages_text_trgm "
            "ON im_messages USING gin (text gin_trgm_ops)"
        )

def downgrade():
    with op.get_context().autocommit_block():
        op.execute("DROP INDEX CONCURRENTLY IF EXISTS ix_im_messages_text_trgm")
```

## Acceptance criteria

1. ILIKE query uses Bitmap Index Scan / Bitmap Heap Scan (no Seq Scan)
2. No full sequential scan for absent/rare/medium terms with length ≥ 3 characters
3. p95 simple search < 1 second (target: < 500 ms)
4. No errors or locking of production writes during index creation
5. Index size and build time recorded
6. Before/after comparison table:

| Scenario | Before | After | Speedup | New plan type |
|----------|--------|-------|---------|---------------|
| absent | 22.0 s | — | — | — |
| rare | 20.9 s | — | — | — |
| frequent | 37.3 s | — | — | — |
| COUNT | 38.0 s | — | — | — |
| deep OFFSET | 38.1 s | — | — | — |
| keyword batch | 0.16 s | — | — | — |

## Risks

- Trigram index may not help for 1-2 character search terms — verify separately
- Index build on 131k rows with TOAST (~315 MB total) may take several minutes
- GIN index is larger than B-tree — monitor disk usage
- `CREATE INDEX CONCURRENTLY` avoids locks but still consumes I/O

## Decision gate after PR-S1

After index is deployed and baseline repeated:

- If COUNT(*) remains expensive → PR-S2 (optional total)
- If deep OFFSET degrades noticeably → PR-S3 (keyset pagination)
- Track D may begin only after successful production benchmark of PR-S1

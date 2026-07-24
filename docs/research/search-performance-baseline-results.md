# Search Performance Baseline — Results

**Date:** 2026-07-24
**Dataset:** content-db.im_messages (130,858 rows at snapshot time)
**Release:** 0.67.6
**Commit:** d16694522

## 1. Dataset Snapshot

| Metric | Value |
|--------|-------|
| Total rows | 130,858 |
| Rows with text | 92,751 (71%) |
| Rows without text (NULL) | 38,107 (29%) |
| Oldest message | 2025-08-04 08:36:46 |
| Newest message | 2026-07-24 04:25:11 |
| Table size | 171 MB |
| Indexes size | 25 MB |
| Total (incl. TOAST) | 315 MB |

### By messenger

| Messenger | Count |
|-----------|-------|
| whatsapp | 108,488 |
| max | 22,370 |

### Text length distribution

| Category | Length | Count |
|----------|--------|-------|
| NULL | — | 38,107 |
| very_short | < 50 | 58,587 |
| short | 50–200 | 22,652 |
| medium | 200–1000 | 3,842 |
| long | 1000–5000 | 414 |
| very_long | > 5000 | 7,274 |

81% of non-null texts are under 200 characters.

## 2. Existing Indexes

| Index | Type | Columns |
|-------|------|---------|
| `im_messages_pkey` | UNIQUE B-tree | `id` |
| `ix_im_messages_messenger_created` | B-tree | `messenger, created_at` |
| `uq_im_messages_natural_key` | UNIQUE B-tree | `messenger, external_id, chat_external_id` |

**No index on `text` column.** All ILIKE queries perform sequential scans.

## 3. Query Matrix

Search terms (anonymized):

| Category | Term | Actual matches (whatsapp) |
|----------|------|--------------------------|
| absent | `xz7k9m2p` | 0 |
| rare | `уникальн` | 20 |
| medium | `встреч` | 215 |
| frequent | `дом` | 2,005 |

## 4. PostgreSQL EXPLAIN (ANALYZE, BUFFERS) Results

### 4.1 Simple search — absent term

```sql
SELECT * FROM im_messages
WHERE messenger = 'whatsapp' AND text ILIKE '%xz7k9m2p%'
ORDER BY created_at DESC NULLS LAST, id DESC
LIMIT 50 OFFSET 0;
```

| Metric | Value |
|--------|-------|
| Execution Time | **21,995 ms** |
| Scan Type | Parallel Seq Scan (2 workers) |
| Rows scanned | ~130,977 (all) |
| Rows returned | 0 |
| Buffers | hit=29,602 + read=14,287 |
| Sort | quicksort, 25kB |

### 4.2 Simple search — rare term

```sql
SELECT * FROM im_messages
WHERE messenger = 'whatsapp' AND text ILIKE '%уникальн%'
ORDER BY created_at DESC NULLS LAST, id DESC
LIMIT 50 OFFSET 0;
```

| Metric | Value |
|--------|-------|
| Execution Time | **20,868 ms** |
| Scan Type | Parallel Seq Scan (2 workers) |
| Rows scanned | ~130,977 (all) |
| Rows returned | 20 |
| Buffers | hit=29,486 + read=14,403 |
| Sort | quicksort, 26kB |

### 4.3 Simple search — frequent term

```sql
SELECT * FROM im_messages
WHERE messenger = 'whatsapp' AND text ILIKE '%дом%'
ORDER BY created_at DESC NULLS LAST, id DESC
LIMIT 50 OFFSET 0;
```

| Metric | Value |
|--------|-------|
| Execution Time | **37,293 ms** |
| Scan Type | Seq Scan (single thread) |
| Rows scanned | ~130,977 (all) |
| Rows returned | 50 (of 2,005 matched) |
| Buffers | hit=29,182 + read=14,545 |
| Sort | top-N heapsort, 134kB |

### 4.4 COUNT(*) query

```sql
SELECT count(*) FROM (
    SELECT * FROM im_messages
    WHERE messenger = 'whatsapp' AND text ILIKE '%дом%'
) AS search_rows;
```

| Metric | Value |
|--------|-------|
| Execution Time | **38,040 ms** |
| Scan Type | Seq Scan |
| Rows scanned | ~130,977 (all) |
| Rows matched | 2,005 |
| Buffers | hit=29,209 + read=14,512 |

### 4.5 Deep OFFSET (page 20)

```sql
SELECT * FROM im_messages
WHERE messenger = 'whatsapp' AND text ILIKE '%дом%'
ORDER BY created_at DESC NULLS LAST, id DESC
LIMIT 50 OFFSET 950;
```

| Metric | Value |
|--------|-------|
| Execution Time | **38,114 ms** |
| Scan Type | Seq Scan |
| Rows scanned | ~130,977 (all) |
| Rows returned | 50 (of 2,005 matched, skipped 950) |
| Buffers | hit=30,776 + read=12,951 |
| Sort | top-N heapsort, 3665kB |

### 4.6 Keyword batch (first page, no ILIKE)

```sql
SELECT * FROM im_messages
WHERE messenger = 'whatsapp'
ORDER BY created_at DESC NULLS LAST, id DESC
LIMIT 5000;
```

| Metric | Value |
|--------|-------|
| Execution Time | **160 ms** |
| Scan Type | Parallel Seq Scan (2 workers) |
| Rows scanned | ~108,488 (whatsapp only) |
| Rows returned | 5,000 |
| Buffers | hit=6,986 + read=14,979 |
| Sort | external merge, 45MB disk |

## 5. Findings

### 5.1 Simple search (ILIKE)

- **All ILIKE queries perform full sequential scan** regardless of term frequency
- Execution time: **21–38 seconds** depending on parallelism
- Absent/rare terms benefit from Parallel Seq Scan (~21s), frequent terms use single-thread Seq Scan (~37s)
- The planner chooses Parallel Seq Scan when it estimates few matching rows
- **No text index exists** — every query reads all 131k rows from disk

### 5.2 COUNT(*) cost

- COUNT(*) costs **the same as the result query** (~38s)
- The Seq Scan dominates; counting adds no meaningful overhead
- **Recommendation:** make COUNT(*) optional or approximate

### 5.3 OFFSET pagination

- Deep OFFSET (page 20) adds **no measurable cost** (~38s vs ~37s for page 1)
- The Seq Scan dominates; OFFSET is negligible
- However, with an index, OFFSET would become expensive (scanning skipped rows)

### 5.4 Keyword batch scan

- Keyword batch (5000 rows, no ILIKE) completes in **160 ms**
- Uses Parallel Seq Scan with messenger filter
- Sort spills to disk (45MB external merge) — work_mem may be too low
- **Python keyword matching** runs in application memory, not measured here

### 5.5 Prometheus metrics

Prometheus was not reachable during measurement. Metrics should be captured separately.

## 6. Risks Before Track D

1. **37-second ILIKE latency** is unacceptable for production use — any search with text filter will timeout
2. **No text index** — adding VK posts (~millions of rows) will make this linearly worse
3. **COUNT(*) always scans all rows** — cannot be served from index
4. **Keyword mode is fast** (160ms per batch) but may reach 25,000 row scan limit with frequent terms
5. **Disk sort in keyword batch** (45MB) indicates low `work_mem` setting
6. **29% NULL texts** — these rows are never searchable but still scanned

## 7. Recommendation

**B. Add pg_trgm + GIN index for text ILIKE** — mandatory before any production search usage.

A trigram GIN index on `text` (with optional messenger filter) would reduce ILIKE queries from ~37s to single-digit milliseconds:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY idx_im_messages_text_gin
  ON im_messages USING GIN (text gin_trgm_ops);
```

**D. Make COUNT(*) optional or approximate** — the exact count costs the same as the full scan.

**E. Replace OFFSET pagination with keyset** — once an index is added, OFFSET becomes expensive.

**F. Add composite index for keyword batch** — `(messenger, created_at DESC, id DESC)` to eliminate disk sort.

## 8. Decision Gate

| Question | Answer |
|----------|--------|
| p95 latency of simple search? | ~38s (all ILIKE queries) |
| Worst-case latency? | ~38s (frequent term + COUNT) |
| Isolated COUNT(*) cost? | ~38s (same as result query) |
| Deep OFFSET behavior? | No extra cost (Seq Scan dominates) |
| Keyword mode rows scanned? | 5,000 per batch, up to 25,000 max |
| 25,000 limit reached? | Not tested — depends on keyword frequency |
| Which queries read from disk? | All ILIKE queries (14k+ read buffers) |
| Which plans use Seq Scan? | All plans — no index on text |
| Expected impact of VK posts? | Linear degradation — millions of rows × 38s |
| Mandatory optimizations before UNION search? | pg_trgm index, approximate COUNT, keyset pagination |

**Verdict: Track D requires a separate search optimization PR before starting.** The current 38-second ILIKE latency is not acceptable for any production search scenario. At minimum, a pg_trgm GIN index must be added before Track D can proceed.

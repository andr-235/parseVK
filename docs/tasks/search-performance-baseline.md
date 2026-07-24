# Search Performance Baseline — Track D prerequisite

## Objective

Measure current production IM search performance on fully restored content-service projection before Track D (Elasticsearch) implementation.

Baseline must be captured before any index changes, query modifications, or Elasticsearch integration.

## Scope

### What to measure

1. Gateway latency (`api-gateway → content-service`)
2. Content-service application latency
3. PostgreSQL query latency (EXPLAIN ANALYZE)
4. Exact `COUNT(*)` cost
5. OFFSET pagination cost
6. Python keyword scan cost (rows scanned, batches)
7. Cache state impact on latency

### Production endpoints

**Gateway public routes:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/im/search/messages` | Simple search → content-service `GET /internal/search/messages` |
| POST | `/api/v1/im/messages/search` | Simple/keyword search → content-service `POST /internal/search/messages/search` |

**Content-service internal routes:**

| Method | Path | Mode |
|--------|------|------|
| GET | `/internal/search/messages` | Simple: ILIKE, COUNT, OFFSET |
| POST | `/internal/search/messages/search` | Simple: ILIKE, COUNT, OFFSET **OR** Keyword: batch scan 5000 rows, max 25000, Python match |

### Search modes

| Mode | Trigger | Query pattern |
|------|---------|--------------|
| Simple GET | any request without `onlyWithKeywords=true` | SQL filters + ILIKE + COUNT(*) + OFFSET/LIMIT |
| Simple POST | `onlyWithKeywords=false` or unset | SQL filters + ILIKE for `query` + COUNT(*) + OFFSET/LIMIT |
| Keyword POST | `onlyWithKeywords=true` + non-empty `keywords` | Keyset pagination batches of 5000 rows, max 25000, keyword matching in Python |

### Preconditions

- [ ] Historical replay completed
- [ ] Source `im-db.im_messages` ↔ projection `content-db.im_messages` reconciled
- [ ] `content-db.im_messages` contains full expected volume (~130,000 rows)
- [ ] No growing Kafka consumer lag
- [ ] Outbox has 0 pending/failed events
- [ ] Gateway backend set to `content`
- [ ] Production running stable for ≥3 poll cycles

## Test plan

### Step 1. Snapshot dataset state

Run before any measurements:

```sql
ANALYZE im_messages;

SELECT
    count(*) AS total_rows,
    count(*) FILTER (WHERE text IS NOT NULL) AS rows_with_text,
    count(*) FILTER (WHERE text IS NULL) AS rows_without_text,
    min(created_at) AS oldest,
    max(created_at) AS newest,
    pg_size_pretty(pg_relation_size('im_messages')) AS table_size,
    pg_size_pretty(pg_indexes_size('im_messages')) AS indexes_size,
    pg_size_pretty(pg_total_relation_size('im_messages')) AS total_size
FROM im_messages;

SELECT messenger, count(*) FROM im_messages GROUP BY messenger ORDER BY messenger;

SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'im_messages' ORDER BY indexname;

SELECT
    seq_scan, seq_tup_read, idx_scan, idx_tup_fetch,
    n_live_tup, n_dead_tup, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'im_messages';
```

### Step 2. Select search terms

Choose 4 term categories from real data (anonymize in report):

| Category | Prevalence |
|----------|-----------|
| absent | Guaranteed no match |
| rare | Single-digit matches |
| medium | Tens to low hundreds of matches |
| frequent | Thousands of matches |

For each term, pre-determine actual match count. Do not use only `дрон`.

### Step 3. End-to-end query matrix

**Simple GET (all terms × pagination × filters):**

Scenarios: no query, absent, rare, medium, frequent; each with/without messenger, chat_id, author; page=1 vs deep page; limit=20/50/200.

**Simple POST (same):**

```json
{"messenger": "whatsapp", "query": "<term>", "page": 1, "limit": 50, "onlyWithKeywords": false}
```

**Keyword POST:**

```json
{"messenger": "whatsapp", "onlyWithKeywords": true, "keywords": ["<kw1>", "<kw2>"], "limit": 50}
```

Scenarios: single rare keyword, multiple rare, mixed, no match, no messenger filter, first cursor page, next cursor page, reaching MATCH_MAX_SCAN (25000).

### Step 4. HTTP measurement methodology

For each scenario:

1. 1 cold start request
2. 5 warm sequential requests

Record: HTTP status, time_total, time_starttransfer, response size, items count, reported total, scanned, hasMore, nextCursor.

Do NOT run concurrent load on production.

### Step 5. Prometheus metrics snapshot

Capture before/after:

```
gateway_search_requests_total{backend, method, outcome}
gateway_search_duration_seconds{backend, method}
content_search_duration_seconds{mode}
content_search_rows_scanned{mode="keyword"}
```

Calculate: p50, p95, p99, request count, error rate, keyword rows-scanned distribution.

Note if sample size is insufficient for reliable p95/p99.

### Step 6. PostgreSQL EXPLAIN ANALYZE

**Simple result query (absent/rare/medium/frequent × messenger/deep OFFSET):**

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS)
SELECT * FROM im_messages
WHERE text ILIKE '%<term>%'
ORDER BY created_at DESC NULLS LAST, id DESC
LIMIT 50 OFFSET 0;
```

**COUNT query:**

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS)
SELECT count(*) FROM (
    SELECT * FROM im_messages WHERE text ILIKE '%<term>%'
) AS search_rows;
```

**Keyword first batch:**

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS)
SELECT * FROM im_messages
WHERE messenger = 'whatsapp'
ORDER BY created_at DESC NULLS LAST, id DESC
LIMIT 5000;
```

**Keyword continuation batch (with real cursor values):**

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS)
SELECT * FROM im_messages
WHERE messenger = 'whatsapp'
  AND (created_at < :ts OR (created_at = :ts AND id < :id))
ORDER BY created_at DESC NULLS LAST, id DESC
LIMIT 5000;
```

### Step 7. EXPLAIN output to capture

For each plan: Planning Time, Execution Time, actual rows, Rows Removed by Filter, shared hit/read blocks, temp read/write blocks, sort method/memory, Seq Scan vs Index Scan, estimated vs actual rows.

### Step 8. Final report structure

Create `docs/research/search-performance-baseline.md` with:

1. Dataset snapshot
2. Existing indexes
3. Endpoint matrix
4. End-to-end HTTP results
5. Prometheus observations
6. EXPLAIN plans
7. Simple search findings
8. COUNT(*) findings
9. OFFSET findings
10. Keyword scan findings
11. Risks before Track D
12. Recommendation

### Recommendations (choose from, do NOT implement in baseline)

| Code | Recommendation |
|------|---------------|
| A | No changes needed yet |
| B | Add pg_trgm + GIN index for text ILIKE |
| C | Add separate trigram index for author |
| D | Remove exact COUNT(*) or make optional/approximate |
| E | Replace OFFSET pagination with keyset |
| F | Add/change B-tree indexes for messenger/chat/date |
| G | Limit or rework Python keyword scan |
| H | Extract unified search to separate search projection before Track D |

### Decision gate

Track D must not start until this report answers:

- What is p95 latency of each production search mode?
- What is worst-case latency?
- What is the isolated cost of COUNT(*)?
- How does deep OFFSET behave?
- How many rows does keyword mode typically scan?
- Is the 25000 limit ever reached?
- Which queries read from disk?
- Which plans use Seq Scan?
- What is the expected impact of adding VK posts?
- Which optimizations are mandatory before UNION search?

## Deliverables

1. RESEARCH.md updated with recovery completion status
2. `docs/research/search-performance-baseline.md` — full baseline report (after execution)
3. Raw SQL/EXPLAIN output
4. HTTP measurement table
5. Prometheus snapshot
6. Recommendation before Track D
7. NO code/index changes as part of baseline

## Out of scope

- Any changes to search code, queries, or indexes
- Elasticsearch implementation (Track D)
- Concurrent/load testing
- VK posts search

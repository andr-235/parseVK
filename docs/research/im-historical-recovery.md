# Research Notes

## PR-C2.1 Production Historical Recovery — FINAL

**Status:** COMPLETE WITH EXPLAINED DIFFERENCES

### Summary

Historical replay of 130,792 IM messages from `im-db` to `content-db` via outbox → Kafka pipeline completed on 2026-07-23 06:43:58 UTC.

### Final counts

| Metric | Source (im-db) | Projection (content-db) | Gap |
|--------|---------------|------------------------|-----|
| Total rows | 130,792 | 130,785 | −7 |
| Distinct natural keys | 130,792 | 130,785 | −7 |
| projection_version=2 | — | 130,785 (100%) | — |

### By messenger

| Messenger | Source | Projection | Diff |
|-----------|--------|------------|------|
| whatsapp | 108,455 | 108,449 | −6 |
| max | 22,337 | 22,336 | −1 |
| **Total** | **130,792** | **130,785** | **−7** |

### Data integrity

- **Invalid rows (null/empty identifiers):** 0
- **Duplicate natural keys:** 0
- **Source `created_at` range:** 2025-08-04 08:36:46 → 2026-07-24 03:40:14
- **Projection `created_at` range:** 2025-08-04 08:36:46 → 2026-07-24 03:40:14 (matches source)
- **Projection `ingested_at` range:** 2026-07-23 06:24:22 → 2026-07-24 03:50:47 (replay window)

### Pipeline delivery

| Stage | Count | Detail |
|-------|-------|--------|
| Source rows processed by replay | 129,482 | hasMore=false, lastImMessageId=165149 |
| Outbox events created (replay-v2) | 129,482 | event_version=2 |
| Outbox published to Kafka | 129,475 | 99.995% delivery |
| Outbox failed (MessageSizeTooLarge) | 7 | deleted from outbox after acceptance |
| Content-service processed events | 133,040 | includes retries |
| Content projection rows | 130,785 | upsert dedup |

### Gap explanation

7 messages (0.005%) were not delivered to content-db because their payload exceeded Kafka broker `message.max.bytes` (default 1 MB). After increasing to 5 MB, 1,005 of 1,012 oversized messages were recovered. The remaining 7 messages (6.4–8.8 MB) still exceeded 5 MB limit and were accepted as loss.

- whatsapp: 6 oversized
- max: 1 oversized

### Hotfixes applied

| # | Commit | Scope | Description |
|---|--------|-------|-------------|
| 1 | `f0c13206c` | outbox/repository.py | UUID callable → model default (removed `id=` line) |
| 2 | `04b820048` | outbox/publisher.py | `UnboundLocalError` — `is_failed = False` before try |
| 3 | `6b34241cb` | poller/service.py | Persist cursor to ImMessengerCursor table |
| 4 | `348985c2f` | replay/processor.py | Explicit `event_version=2` in replay emit |
| 5 | `2dad6fc61` | outbox/publisher.py + config.py | Kafka `max_request_size=5MB`, DLQ try/except |
| 6 | `9e03b44ff` | docker-compose.yml | `IM_SERVICE_REPLAY_ENABLED: true` |
| 7 | `848670e8e` | docker-compose.yml | Kafka broker `message.max.bytes=5MB` + topics |

### Errors during recovery

- **im-service:** 8,102 ERROR (all related to oversized message retries during replay — resolved)
- **content-service:** 0 ERROR, 0 DLQ entries
- **Pending outbox:** 0
- **Failed outbox:** 0 (7 deleted after acceptance)

### Limitations

1. 7 oversized messages permanently lost (0.005%)
2. Projection contains only records processed through replay; incremental live poller events are continuously ingested
3. Outbox dedupe prevents re-processing of failed events without manual reset
4. Kafka broker-level `message.max.bytes` set to 5 MB; any future message exceeding this will also fail

### Completion date

2026-07-24

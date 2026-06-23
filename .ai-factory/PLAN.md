# Plan: EDA Compliance Improvements (P0/P1)

**Created:** 2026-06-23
**Type:** Enhancement
**Branch:** `main` (fast plan, no branch)

## Settings

| Setting | Value |
|---------|-------|
| Testing | Yes — include tests for each change |
| Logging | Verbose — DEBUG-level for new Kafka/outbox components, INFO for existing |
| Docs | No — warn-only, no mandatory docs checkpoint |

## Roadmap Linkage

**Milestone:** "EDA Hardening & Shared Schemas" (new)
**Rationale:** Implements P0/P1 improvements identified in EDA compliance audit: shared event schemas, tasks-service DLQ, persistent consumer retry, and DLQ monitoring.

## Tasks

### Phase 1: Shared Event Schemas — Extract to `libs/py/common/`

**Goal:** Eliminate copy-pasted local event models. All services use shared types from `libs/py/common/common/events/`.

#### Task 1.1: Extend shared event types with VkEvent, ImEvent, TaskEvent models

- **Files:** `libs/py/common/common/events/types.py`, `libs/py/common/common/events/base.py`, `libs/py/common/common/events/__init__.py`
- Add `VkEvent(ConsumerEvent)` with `event_type: VkEventType` to `base.py`
- Add `ImEvent(ConsumerEvent)` with `event_type: ImEventType` to `base.py`
- Add `TaskEvent(ConsumerEvent)` with `event_type: TaskEventType` to `base.py`
- Re-export all new models in `__init__.py`
- **Note:** im-service `TaskEvent` has different literals (no `cancelled`/`failed`). Keep both variants or use union. Keep the domain helper methods (`task_id()`, `scope()`, etc.) on the im-service side for now — extracting domain logic is out of scope.
- **Logging:** DEBUG on module load, INFO on any event type validation
- **Tests:** Unit tests for each new model — construct with valid/invalid event types, test serialization round-trip

#### Task 1.2: Migrate vk-service to shared event models

- **Files:** `services/vk-service/app/domain/events/task_events.py`
- Replace local `TaskEvent(ConsumerEvent)` with import from `common.events`
- Remove the local file after migration
- Verify all imports in `services/vk-service/app/tasks/kafka_consumer.py` still work
- **Logging:** DEBUG on import, WARN if old module is still referenced
- **Tests:** Run existing integration tests (`tests/test_integration_kafka.py`) to verify no regression

#### Task 1.3: Migrate im-service to shared event models

- **Files:** `services/im-service/app/modules/tasks/events.py`
- Replace local `TaskEvent(ConsumerEvent)` with import from `common.events`
- Preserve domain helper methods (`task_id()`, `scope()`, `mode()`, etc.) — either keep them in a smaller local helper or add them to the shared model as optional methods
- **Note:** im-service `TaskEvent` only supports `task.created`, `task.resumed`, `task.deleted`. Ensure the shared type accommodates this subset
- **Logging:** DEBUG on import
- **Tests:** Unit tests for domain helpers on the shared model

#### Task 1.4: Migrate content-service to shared event models

- **Files:** `services/content-service/app/modules/im_events/service.py`, `services/content-service/app/modules/projections/processor.py`
- Replace local `ImEvent(ConsumerEvent)` and `VkEvent(ConsumerEvent)` (both are empty subclasses) with direct import of `ImEvent` / `VkEvent` from `common.events`
- Remove the local empty class definitions
- **Logging:** DEBUG on import
- **Tests:** Verify all consumer tests pass

#### Task 1.5: Migrate moderation-service to shared event models

- **Files:** `services/moderation-service/app/modules/moderation/schemas.py`
- Replace local `VkEvent(ConsumerEvent)` with import from `common.events`
- Remove the local empty class definition
- **Logging:** DEBUG on import
- **Tests:** Verify all consumer tests pass

### Phase 2: tasks-service DLQ (P0)

**Goal:** Failed outbox events in tasks-service go to `parsevk.tasks.dlq` instead of dead-ending at `status = "failed"`.

#### Task 2.1: Add DLQ publishing to tasks-service OutboxPublisher

- **Files:** `services/tasks-service/app/modules/outbox/publisher.py`, `services/tasks-service/app/core/config.py`
- Add `settings.kafka_topic_tasks_dlq` to config (default: `"parsevk.tasks.dlq"`)
- In `OutboxPublisher.publish_batch()`: on `send_and_wait` failure, catch exception, call `repository.mark_failed(event, error)`, and if `event.attempts >= MAX_OUTBOX_ATTEMPTS`, send event to DLQ topic
- Create `_publish_to_dlq()` method similar to vk-service (`outbox_worker.py:92-113`): create ephemeral `AIOKafkaProducer`, send raw JSON, close producer
- **Key fix:** Publisher currently does NOT call `mark_failed` on error — events stay `locked`. Add `mark_failed` call in the `except` block.
- **Logging:** WARN on DLQ publish, ERROR if DLQ send fails
- **Tests:** Unit test: mock repository, simulate `send_and_wait` failure, verify `mark_failed` called and DLQ producer invoked after 5th attempt

### Phase 3: Persistent Consumer Retry + Backoff (P1)

**Goal:** Replace in-memory `_retry_count` dict with DB-backed retry tracking that survives service restart.

#### Task 3.1: Add retry fields to processed_events table schema (all 4 consumer services)

- **Files:**
  - `services/vk-service/app/domain/models/tasks.py`
  - `services/im-service/app/db/models.py`
  - `services/content-service/app/db/models.py`
  - `services/moderation-service/app/db/models.py`
- Add columns to `ProcessedEvent` model: `retry_count: int = 0`, `last_error: Text | None = None`, `next_retry_at: DateTime | None = None`
- Add Alembic migration for each service to add these columns
- **Logging:** INFO on migration execution, DEBUG on column add
- **Tests:** Verify migration creates columns correctly (use Alembic test helpers)

#### Task 3.2: Implement DB-backed retry + exponential backoff in all 4 consumers

- **Files:**
  - `services/vk-service/app/tasks/kafka_consumer.py`
  - `services/im-service/app/modules/tasks/consumer.py`
  - `services/content-service/app/modules/projections/consumer.py`
  - `services/content-service/app/modules/im_events/consumer.py`
  - `services/moderation-service/app/modules/moderation/consumer.py`
- Replace in-memory `_retry_count: dict[str, int]` with DB-backed retry:
  - On `handle_message()` failure: insert/replace into `processed_events` with incremented `retry_count` and `last_error`
  - If `retry_count < MAX_CONSUMER_RETRIES` (3): set `next_retry_at = now + min(2^retry_count, 60)s`, skip message (do NOT commit offset)
  - If `retry_count >= MAX_CONSUMER_RETRIES`: send to DLQ, commit offset, log WARN
  - On startup: consumers resume with existing `processed_events` retry state (no loss on restart)
- **Logging:** WARN on retry (with count and backoff delay), ERROR on max retries exceeded, INFO on DLQ send
- **Tests:** Integration test: simulate persistent failure, restart consumer, verify retry state survives and DLQ fires after 3 attempts

### Phase 4: DLQ Monitoring & Alerting (P1)

**Goal:** Prometheus alerts for DLQ events, consumer lag, outbox backlog.

#### Task 4.1: Add Prometheus alert rules for EDA health

- **Files:** `monitoring/alert_rules.yml`
- Add alert `OutboxBacklogHigh`: `sum by(service) (outbox_pending_events) > 100` for 5m → `warning`
- Add alert `ConsumerLagHigh`: `kafka_consumer_lag > 1000` for 10m → `warning`
- Add alert `DLQNonZeroOffset`: `sum by(topic) (kafka_topic_partition_current_offset{topic=~".*dlq"}) > 0` for 5m → `critical`
- Add alert `KafkaConsumerDown`: `up{job=~"vk-service|im-service|content-service|moderation-service"} == 0` for 1m → `critical`
- **Logging:** N/A (alert rules are static config)
- **Tests:** Validate YAML syntax with `promtool check rules`

## Commit Plan

| # | Tasks | Commit Message |
|---|-------|----------------|
| 1 | 1.1–1.5 | `feat(common): extract shared Kafka event models to libs/py/common/events/` |
| 2 | 2.1 | `fix(tasks-service): add DLQ publishing for outbox failures` |
| 3 | 3.1–3.2 | `fix(kafka): replace in-memory consumer retry with DB-backed persistent retry` |
| 4 | 4.1 | `feat(monitoring): add EDA health alerts for DLQ, consumer lag, outbox backlog` |

## Dependencies

- Phase 1 must be completed before any consumer service migration (Tasks 1.2–1.5 blocked by 1.1)
- Phase 2 is independent of Phase 1
- Phase 3 is independent of Phase 1 and 2
- Phase 4 is independent of all other phases

## Risks & Edge Cases

- **im-service TaskEvent domain helpers** (`task_id()`, `scope()` etc.) read from `self.payload`. If these are extracted to shared model, ensure they don't break existing consumers. Decision: keep helpers local to im-service for now.
- **Different TaskEvent literals** between vk-service and im-service. Shared type must use a union or a superset. vk-service includes `cancelled`/`failed`, im-service does not. Use the full `TaskEventType` from `types.py`.
- **Consumer retry backoff formula**: `asyncio.sleep(min(2^retry_count, 60))` seconds. This gives: 2s, 4s, 8s, capped at 60s. Do not use blocking `time.sleep()`.
- **Duplicate metric names**: content-service uses `kafka_consumer_lag_vk` and `kafka_consumer_lag_im` instead of standard `kafka_consumer_lag`. Standardize or leave for a separate refactoring task (out of scope).

# Fix Plan: EDA Consumer Bugfixes — Poison Pill & Retry Backoff Offset

Branch: main
Created: 2026-06-23

## Settings
- Testing: yes
- Logging: verbose
- Docs: warn-only

## Roadmap Linkage
Milestone: "EDA Hardening & Shared Schemas"
Rationale: Fixes two critical consumer bugs found during EDA compliance audit

## Tasks

### Phase 1: Fix Poison Pill (malformed messages without event_id)

Во всех 5 консьюмерах: когда приходит невалидное сообщение (не JSON, без `event_id`),
`_handle_processing_failure` логирует ошибку, но не коммитит offset и не отправляет в DLQ.
Консьюмер навсегда зависает на этом offset.

**Fix:** в `_handle_processing_failure` в ветке `else` (когда payload is None / нет event_id):
- Отправить сырое сообщение в DLQ-топик (где DLQ API доступен)
- Закоммитить offset через `await self._consumer.commit()`
- Добавить `[FIX]`-логирование

- [x] Task 1: Fix poison pill in **vk-service** consumer — `services/vk-service/app/tasks/kafka_consumer.py`
- [x] Task 2: Fix poison pill in **im-service** consumer — `services/im-service/app/modules/tasks/consumer.py`
- [x] Task 3: Fix poison pill in **content-service (projections)** consumer — `services/content-service/app/modules/projections/consumer.py`
- [x] Task 4: Fix poison pill in **content-service (im_events)** consumer — `services/content-service/app/modules/im_events/consumer.py`
- [x] Task 5: Fix poison pill in **moderation-service** consumer — `services/moderation-service/app/modules/moderation/consumer.py`

### Phase 2: Fix Retry Backoff Offset Commit

- [x] Task 6: Fix retry backoff offset commit in **vk-service** — `services/vk-service/app/tasks/kafka_consumer.py`
- [x] Task 7: Fix retry backoff offset commit in **im-service** — `services/im-service/app/modules/tasks/consumer.py`
- [x] Task 8: Fix retry backoff offset commit in **content-service (projections)** — `services/content-service/app/modules/projections/consumer.py`
- [x] Task 9: Fix retry backoff offset commit in **content-service (im_events)** — `services/content-service/app/modules/im_events/consumer.py`
- [x] Task 10: Fix retry backoff offset commit in **moderation-service** — `services/moderation-service/app/modules/moderation/consumer.py`

### Phase 3: Tests
- [ ] Task 11: Add/update tests for poison pill handling in all 5 services
- [ ] Task 12: Add/update tests for retry backoff offset commit in all 5 services

# P2 hardening plan

Umbrella tracking issue: #411.

## Phase A — canonical command path

- freeze normalized TaskRun source/configuration snapshots for every run;
- resolve `scope=all` before the snapshot is persisted;
- publish `vk.execution.requested` transactionally through the tasks outbox;
- validate the generated contract in a dedicated `vk-service` consumer;
- keep the legacy task-events consumer available only through an explicit rollback flag.

## Phase B — source-level identity

Move coalescing identity to one physical VK source per `VkSourceCollection` and exclude TaskRun metadata from the physical fingerprint.

## Phase C — outcomes and cutover

Add explicit rejection outcomes, full PostgreSQL/Kafka recovery coverage, shadow/canary evidence, and remove the legacy task-event runtime after the observation window.

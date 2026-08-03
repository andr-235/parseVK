# P2 hardening plan

Umbrella tracking issue: to be linked after issue creation.

## Phase A

Wire immutable TaskRun snapshots to the canonical `vk.execution.requested` command path.

## Phase B

Move coalescing identity to one physical VK source per `VkSourceCollection`.

## Phase C

Add explicit rejection outcomes, full PostgreSQL/Kafka recovery coverage, and remove the legacy task-event runtime after the observation window.

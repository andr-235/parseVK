# P2 runtime review findings

The P2 runtime is not considered complete until the following cross-service gaps are closed:

1. `tasks-service` publishes the canonical `vk.execution.requested` contract from an immutable TaskRun snapshot.
2. `vk-service` consumes only the canonical command for the new runtime; arbitrary task lifecycle events cannot create collection work.
3. `scope=all` is resolved before the TaskRun snapshot is frozen.
4. Collection identity excludes TaskRun metadata and is based on an explicit physical-plan allowlist.
5. One physical VK source maps to one `VkSourceCollection`.
6. Active-demand conflicts produce a durable explicit outcome instead of silently dropping a run.
7. A PostgreSQL + Kafka end-to-end scenario proves coalescing, crash recovery, fencing and per-demand terminal fan-out.

Implementation is split into canonical-command, source-identity and cutover pull requests so the worker fencing core remains unchanged.

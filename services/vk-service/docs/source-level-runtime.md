# Canonical source-level VK runtime

`tasks-service` freezes every TaskRun and publishes only canonical VK commands.

`vk-service` creates one `VkSourceCollection` and one physical `VkExecution` per source and physical collection plan. Multiple TaskRuns may attach independent demands to the same active collection.

`VkTaskRunBinding` owns user-visible lifecycle aggregation. A source attempt updates its source demands; the binding emits one started event, aggregated progress, and one terminal event after all source demands become terminal.

The legacy `task.*` execution consumer and aggregate multi-source collection identity are removed. The cutover migration invalidates active aggregate executions rather than silently reinterpreting them as source-level work.

## Hard-cutover deployment order

The old and new VK command consumers must never run concurrently during the cutover:

1. stop the old `tasks-service` outbox publisher and old `vk-service` consumer;
2. deploy and migrate `vk-service`;
3. start the canonical `vk-service` command consumer and workers;
4. deploy and start `tasks-service`;
5. allow the startup replay to queue every active frozen TaskRun;
6. verify that each active TaskRun has a `VkTaskRunBinding` before resuming normal automation traffic.

The replay uses a dedicated cutover dedupe key and a new message id, so it can rebuild runtime state even when the PR06A bridge already recorded the original message id in the VK inbox. Restarting `tasks-service` is safe because the replay key is deterministic.

Rollback after canonical source data is created is intentionally blocked. Restore the pre-cutover database backup instead of coercing source-level rows back into aggregate executions.

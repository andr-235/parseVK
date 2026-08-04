# Canonical source-level VK runtime

`tasks-service` freezes every TaskRun and publishes only canonical VK commands.

`vk-service` creates one `VkSourceCollection` and one physical `VkExecution` per source and physical collection plan. Multiple TaskRuns may attach independent demands to the same active collection.

`VkTaskRunBinding` owns user-visible lifecycle aggregation. A source attempt updates its source demands; the binding emits one started event, aggregated progress, and one terminal event after all source demands become terminal.

The legacy `task.*` execution consumer and aggregate multi-source collection identity are removed. The cutover migration invalidates active aggregate executions rather than silently reinterpreting them as source-level work.

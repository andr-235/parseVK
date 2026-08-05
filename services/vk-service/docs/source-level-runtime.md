# Canonical source-level VK runtime

The VK runtime accepts one canonical `vk.execution.requested` contract.

Each immutable TaskRun creates one `VkTaskRunBinding`. Every frozen source demand creates one `VkCollectionDemand`. Compatible demands from different TaskRuns share one active `VkSourceCollection` and one physical `VkExecution`.

The runtime has no legacy `task.created` execution bridge, no generic task-event execution consumer, no versioned execution-request models and no aggregate group-set collection identity. Cancellation is delivered through `vk.execution.cancel_requested` on the same Kafka topic and partition identity as the execution request.

The cutover migration terminates active legacy aggregate executions and removes their collection/demand rows before enabling canonical source-level processing. Historical terminal executions remain for audit, but are never eligible for source-level coalescing.

TaskRun lifecycle is aggregated through `VkTaskRunBinding`: a TaskRun completes only after all of its source demands become terminal. A failed source fails the binding after all source demands are terminal; cancellation detaches only that binding's demands and stops a physical collection only when no active demand remains.

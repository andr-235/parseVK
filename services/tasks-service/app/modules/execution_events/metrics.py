"""Metrics for execution event processing."""

import logging

logger = logging.getLogger(__name__)

# In production this would increment counters; for now just logging.
execution_event_counters = {
    "started": 0,
    "progressed": 0,
    "completed": 0,
    "failed": 0,
    "skipped": 0,
    "gap": 0,
}


def count_event(event_type: str) -> None:
    """Count a successfully applied execution event."""
    short = event_type.replace("task.execution_", "")
    if short in execution_event_counters:
        execution_event_counters[short] += 1
    logger.debug(
        "Execution event counter: %s=%d", short, execution_event_counters[short]
    )


task_run_created_counter = 0


def count_task_run_created() -> None:
    """Count a frozen immutable TaskRun snapshot (issue #284 DoD logs/metrics)."""
    global task_run_created_counter
    task_run_created_counter += 1
    logger.debug("TaskRun created counter: %d", task_run_created_counter)

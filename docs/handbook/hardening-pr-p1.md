# PR-P1 Hardening: Post-release Checklist

**Created:** 2026-07-27
**Related PRs:** PR-P1 (Phase C fix, NULL lease recovery, automation contract)
**Status:** Pending pre-deployment validation

## Pre-deployment checks

- [ ] Run full regression suite: `cd services/vk-service && python -m pytest tests/ -v`
- [ ] Run full regression suite: `cd services/tasks-service && python -m pytest tests/ -v`
- [ ] Run `ruff check` on all changed files
- [ ] Verify GitHub Actions CI passes for the hardening PR branch

## Operational checks

- [ ] Check outbox/Kafka for unprocessed `task.automation_run_requested` events with old (partial) payload.
      Query: `SELECT * FROM outbox WHERE event_type = 'task.automation_run_requested' AND created_at < '2026-07-27';`
      If any exist, either:
      - Delete them (if the tasks were already processed), OR
      - Re-create with full payload using the `task_request_payload` helper.
- [ ] Verify no VkTaskRun rows exist with status="running" AND lease_expires_at IS NULL (stuck from before the fix).
      Query: `SELECT * FROM vk_task_runs WHERE status = 'running' AND lease_expires_at IS NULL;`
- [ ] Monitor logs after deploy for "[TaskEventsService] Legacy automation event detected" warnings.

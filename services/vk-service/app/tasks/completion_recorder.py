from app.domain.entities.tasks import VkTaskRun


class TaskCompletionRecorder:
    def __init__(self, *, session_factory, ingestion_factory):
        self.session_factory = session_factory
        self.ingestion_factory = ingestion_factory

    async def record(self, task_run: VkTaskRun, remote: dict) -> None:
        async with self.session_factory() as session:
            service = self.ingestion_factory(session)
            if service.outbox is None:
                raise RuntimeError("VK task completion outbox is not configured")
            await service.outbox.emit_task_completed(
                task_id=task_run.task_id,
                run_id=task_run.run_id,
                stats=remote.get("stats") or {},
                correlation_id=task_run.run_id,
            )
            await session.commit()

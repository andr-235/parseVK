from datetime import UTC, datetime

from app.infrastructure.db.repositories.task_queue import SqlAlchemyTaskQueueRepository


class TaskLeaseStore:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    async def claim(self, *, worker_id: str, lease_expires_at: datetime):
        return await self._call(
            "claim_next", worker_id=worker_id, lease_expires_at=lease_expires_at
        )

    async def renew(self, **kwargs) -> bool:
        return await self._call("renew_lease", **kwargs)

    async def done(self, **kwargs) -> bool:
        return await self._call("mark_done", **kwargs)

    async def failed(self, **kwargs) -> bool:
        return await self._call("mark_failed", **kwargs)

    async def release(self, **kwargs) -> bool:
        return await self._call("release", **kwargs)

    async def _call(self, method_name: str, **kwargs):
        async with self.session_factory() as session:
            async with session.begin():
                repository = SqlAlchemyTaskQueueRepository(session)
                return await getattr(repository, method_name)(**kwargs)


def lease_deadline(seconds: int) -> datetime:
    from datetime import timedelta

    return datetime.now(UTC) + timedelta(seconds=seconds)

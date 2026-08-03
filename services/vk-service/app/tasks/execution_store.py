from datetime import UTC, datetime, timedelta

from app.infrastructure.db.repositories.executions import SqlAlchemyExecutionRepository


class ExecutionStore:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    async def claim(self, *, worker_id: str, lease_expires_at: datetime):
        return await self._call(
            "claim_next", worker_id=worker_id, lease_expires_at=lease_expires_at
        )

    async def renew(self, **kwargs) -> bool:
        return await self._call("renew", **kwargs)

    async def complete(self, **kwargs) -> bool:
        return await self._call("complete", **kwargs)

    async def fail(self, **kwargs) -> bool:
        return await self._call("fail", **kwargs)

    async def cancel(self, **kwargs) -> bool:
        return await self._call("cancel", **kwargs)

    async def release(self, **kwargs) -> bool:
        return await self._call("release", **kwargs)

    async def _call(self, method_name: str, **kwargs):
        async with self.session_factory() as session:
            async with session.begin():
                repository = SqlAlchemyExecutionRepository(session)
                return await getattr(repository, method_name)(**kwargs)


def lease_deadline(seconds: int) -> datetime:
    return datetime.now(UTC) + timedelta(seconds=seconds)


def immediate_retry() -> datetime:
    return datetime.now(UTC)

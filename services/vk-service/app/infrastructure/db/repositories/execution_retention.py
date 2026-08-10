from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.executions import VkExecution
from app.infrastructure.db.models.ingestion_staging import VkIngestionStagingBatch
from app.services.ingestion.lifecycle_metrics import observe_blocked_cleanup


class ExecutionRetentionBlockedError(RuntimeError):
    def __init__(self, execution_id: UUID, blockers: tuple[dict, ...]):
        super().__init__(f"execution {execution_id} has {len(blockers)} nonterminal staging batches")
        self.execution_id = execution_id
        self.blockers = blockers


async def cleanup_blockers(
    session: AsyncSession,
    execution_id: UUID,
    *,
    lock: bool = False,
) -> tuple[dict, ...]:
    statement = (
        select(VkIngestionStagingBatch)
        .where(
            VkIngestionStagingBatch.execution_id == execution_id,
            VkIngestionStagingBatch.status != "payload_purged",
        )
        .order_by(VkIngestionStagingBatch.created_at, VkIngestionStagingBatch.id)
    )
    if lock and session.get_bind().dialect.name == "postgresql":
        statement = statement.with_for_update(of=VkIngestionStagingBatch)
    rows = (await session.scalars(statement)).all()
    now = datetime.now(UTC)
    return tuple(
        {
            "batchId": str(row.id),
            "status": row.status,
            "ageSeconds": max(0.0, (now - _aware(row.created_at)).total_seconds()),
        }
        for row in rows
    )


async def delete_execution_guarded(session: AsyncSession, execution_id: UUID) -> bool:
    execution = await session.scalar(
        select(VkExecution).where(VkExecution.id == execution_id).with_for_update()
    )
    if execution is None:
        return False
    blockers = await cleanup_blockers(session, execution_id, lock=True)
    if blockers:
        observe_blocked_cleanup(execution_id, blockers)
        raise ExecutionRetentionBlockedError(execution_id, blockers)
    await session.delete(execution)
    await session.flush()
    return True


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)

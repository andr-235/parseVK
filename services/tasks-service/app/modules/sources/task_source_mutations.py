"""Serialized mutations of one task's effective normalized source set."""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task, TaskSource, utcnow
from app.modules.sources.errors import TaskNotFoundError

VALID_KINDS = frozenset({"target", "reference"})


def _validate_kind(kind: str) -> None:
    if kind not in VALID_KINDS:
        raise ValueError(f"Unsupported task source kind: {kind}")


async def _lock_task(session: AsyncSession, task_id: int) -> Task:
    task = await session.scalar(
        select(Task)
        .where(Task.id == task_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if task is None:
        raise TaskNotFoundError(f"Task {task_id} not found")
    return task


def _advance_source_set(task: Task) -> None:
    task.source_set_revision = int(task.source_set_revision or 0) + 1
    task.updated_at = utcnow()


async def link_task_source(
    session: AsyncSession,
    task_id: int,
    source_id: UUID,
    kind: str = "target",
) -> TaskSource:
    """Attach or reclassify a source and advance the set revision once."""
    _validate_kind(kind)
    task = await _lock_task(session, task_id)
    existing = await session.scalar(
        select(TaskSource)
        .where(
            TaskSource.task_id == task_id,
            TaskSource.source_id == source_id,
        )
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if existing is not None:
        if existing.kind == kind:
            return existing
        existing.kind = kind
        existing.revision += 1
        _advance_source_set(task)
        await session.flush()
        return existing

    link = TaskSource(task_id=task_id, source_id=source_id, kind=kind)
    session.add(link)
    _advance_source_set(task)
    await session.flush()
    await session.refresh(link)
    return link


async def unlink_task_source(
    session: AsyncSession,
    task_id: int,
    source_id: UUID,
) -> bool:
    """Detach one source; an already absent source is an idempotent no-op."""
    task = await _lock_task(session, task_id)
    existing = await session.scalar(
        select(TaskSource)
        .where(
            TaskSource.task_id == task_id,
            TaskSource.source_id == source_id,
        )
        .with_for_update()
    )
    if existing is None:
        return False
    await session.delete(existing)
    _advance_source_set(task)
    await session.flush()
    return True


async def sync_task_sources(
    session: AsyncSession,
    task_id: int,
    desired: Iterable[tuple[UUID, str]],
) -> bool:
    """Replace the effective set atomically and advance its revision once."""
    desired_by_id: dict[UUID, str] = {}
    for source_id, kind in desired:
        _validate_kind(kind)
        previous = desired_by_id.get(source_id)
        if previous is not None and previous != kind:
            raise ValueError(
                f"Source {source_id} requested with conflicting kinds"
            )
        desired_by_id[source_id] = kind

    task = await _lock_task(session, task_id)
    existing = list(
        (
            await session.scalars(
                select(TaskSource)
                .where(TaskSource.task_id == task_id)
                .order_by(TaskSource.source_id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )
        ).all()
    )
    existing_by_id = {link.source_id: link for link in existing}
    current = {source_id: link.kind for source_id, link in existing_by_id.items()}
    if current == desired_by_id:
        return False

    for source_id, link in existing_by_id.items():
        kind = desired_by_id.get(source_id)
        if kind is None:
            await session.delete(link)
        elif link.kind != kind:
            link.kind = kind
            link.revision += 1

    for source_id, kind in desired_by_id.items():
        if source_id not in existing_by_id:
            session.add(
                TaskSource(
                    task_id=task_id,
                    source_id=source_id,
                    kind=kind,
                )
            )

    _advance_source_set(task)
    await session.flush()
    return True

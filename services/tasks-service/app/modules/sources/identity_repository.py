from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MonitoringSource, SourceRegistration, utcnow


async def get_or_create_source(
    session: AsyncSession,
    source: MonitoringSource,
) -> MonitoringSource:
    """Return one canonical source under concurrent registration."""
    now = utcnow()
    statement = (
        insert(MonitoringSource)
        .values(
            id=source.id,
            owner_user_id=source.owner_user_id,
            provider=source.provider,
            source_type=source.source_type,
            external_id=source.external_id,
            owner_id=source.owner_id,
            display_name=source.display_name,
            status=source.status or "active",
            revision=int(source.revision or 0),
            created_at=source.created_at or now,
            updated_at=source.updated_at or now,
        )
        .on_conflict_do_nothing(
            constraint="uq_monitoring_sources_identity",
        )
        .returning(MonitoringSource)
    )
    persisted = await session.scalar(statement)
    if persisted is not None:
        return persisted

    persisted = await session.scalar(
        select(MonitoringSource).where(
            MonitoringSource.provider == source.provider,
            MonitoringSource.source_type == source.source_type,
            MonitoringSource.external_id == source.external_id,
        )
    )
    if persisted is None:
        raise RuntimeError(
            "canonical source insert conflicted without an identity row"
        )
    return persisted


async def ensure_source_registration(
    session: AsyncSession,
    owner_user_id: str,
    source_id: UUID,
) -> SourceRegistration:
    """Idempotently make a global source visible to one user."""
    statement = (
        insert(SourceRegistration)
        .values(owner_user_id=owner_user_id, source_id=source_id)
        .on_conflict_do_nothing(
            index_elements=[
                SourceRegistration.owner_user_id,
                SourceRegistration.source_id,
            ]
        )
        .returning(SourceRegistration)
    )
    registration = await session.scalar(statement)
    if registration is not None:
        return registration

    registration = await session.scalar(
        select(SourceRegistration).where(
            SourceRegistration.owner_user_id == owner_user_id,
            SourceRegistration.source_id == source_id,
        )
    )
    if registration is None:
        raise RuntimeError("source registration conflict returned no row")
    return registration

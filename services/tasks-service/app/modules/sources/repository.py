"""Sources module repository: async CRUD over source/task-source tables.

MonitoringSource is a globally deduplicated identity. User visibility is
derived from durable registration, owned task links, or effective access
scope grants rather than treating the first registering user as the sole owner.
"""

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import exists, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    AccessScope,
    MonitoringSource,
    ScopeSourceAccess,
    SourceRegistration,
    Task,
    TaskSource,
    utcnow,
)
from app.modules.sources.task_source_mutations import (
    link_task_source as mutate_task_source_link,
)
from app.modules.sources.task_source_mutations import (
    sync_task_sources as synchronize_task_sources,
)
from app.modules.sources.task_source_mutations import (
    unlink_task_source as mutate_task_source_unlink,
)


class SourcesRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_source(self, source: MonitoringSource) -> MonitoringSource:
        """Compatibility wrapper for atomic canonical source creation."""
        return await self.get_or_create_source(source)

    async def get_or_create_source(
        self,
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
        persisted = await self.session.scalar(statement)
        if persisted is not None:
            return persisted

        persisted = await self.get_source_by_identity(
            source.provider,
            source.source_type,
            source.external_id,
        )
        if persisted is None:
            raise RuntimeError(
                "canonical source insert conflicted without an identity row"
            )
        return persisted

    async def ensure_source_registration(
        self,
        owner_user_id: str,
        source_id: UUID,
    ) -> SourceRegistration:
        """Idempotently make a global source visible to one user."""
        statement = (
            insert(SourceRegistration)
            .values(
                owner_user_id=owner_user_id,
                source_id=source_id,
            )
            .on_conflict_do_nothing(
                index_elements=[
                    SourceRegistration.owner_user_id,
                    SourceRegistration.source_id,
                ]
            )
            .returning(SourceRegistration)
        )
        registration = await self.session.scalar(statement)
        if registration is not None:
            return registration

        registration = await self.session.scalar(
            select(SourceRegistration).where(
                SourceRegistration.owner_user_id == owner_user_id,
                SourceRegistration.source_id == source_id,
            )
        )
        if registration is None:
            raise RuntimeError("source registration conflict returned no row")
        return registration

    async def get_source_by_id(self, source_id: UUID) -> MonitoringSource | None:
        return await self.session.get(MonitoringSource, source_id)

    async def get_source_by_identity(
        self, provider: str, source_type: str, external_id: str
    ) -> MonitoringSource | None:
        return await self.session.scalar(
            select(MonitoringSource).where(
                MonitoringSource.provider == provider,
                MonitoringSource.source_type == source_type,
                MonitoringSource.external_id == external_id,
            )
        )

    async def touch_source(self, source: MonitoringSource) -> MonitoringSource:
        source.updated_at = utcnow()
        source.revision += 1
        await self.session.flush()
        return source

    @staticmethod
    def _owner_visibility_clause(owner_user_id: str):
        registered_to_owner = exists(
            select(1)
            .select_from(SourceRegistration)
            .where(
                SourceRegistration.source_id == MonitoringSource.id,
                SourceRegistration.owner_user_id == owner_user_id,
            )
        )
        linked_to_owner = exists(
            select(1)
            .select_from(TaskSource)
            .join(Task, Task.id == TaskSource.task_id)
            .where(
                TaskSource.source_id == MonitoringSource.id,
                Task.owner_user_id == owner_user_id,
            )
        )
        granted_to_owner_scope = exists(
            select(1)
            .select_from(ScopeSourceAccess)
            .join(
                AccessScope,
                AccessScope.id == ScopeSourceAccess.access_scope_id,
            )
            .where(
                ScopeSourceAccess.source_id == MonitoringSource.id,
                AccessScope.owner_user_id == owner_user_id,
                ScopeSourceAccess.ref_count > 0,
                ScopeSourceAccess.revoked_at.is_(None),
            )
        )
        return or_(
            registered_to_owner,
            MonitoringSource.owner_user_id == owner_user_id,
            linked_to_owner,
            granted_to_owner_scope,
        )

    async def list_sources(
        self, owner_user_id: str
    ) -> tuple[list[MonitoringSource], int]:
        result = await self.session.scalars(
            select(MonitoringSource)
            .where(self._owner_visibility_clause(owner_user_id))
            .order_by(MonitoringSource.created_at.desc())
        )
        sources = list(result)
        return sources, len(sources)

    async def list_active_sources(
        self,
        owner_user_id: str,
        *,
        provider: str = "vk",
        source_type: str = "community",
    ) -> list[MonitoringSource]:
        """Return the owner's concrete active source set for ``scope=all``."""
        result = await self.session.scalars(
            select(MonitoringSource)
            .where(
                MonitoringSource.provider == provider,
                MonitoringSource.source_type == source_type,
                MonitoringSource.status == "active",
                self._owner_visibility_clause(owner_user_id),
            )
            .order_by(
                MonitoringSource.external_id.asc(),
                MonitoringSource.id.asc(),
            )
        )
        return list(result)

    async def link_task_source(
        self, task_id: int, source_id: UUID, kind: str = "target"
    ) -> TaskSource:
        return await mutate_task_source_link(
            self.session,
            task_id,
            source_id,
            kind,
        )

    async def unlink_task_source(self, task_id: int, source_id: UUID) -> bool:
        return await mutate_task_source_unlink(
            self.session,
            task_id,
            source_id,
        )

    async def sync_task_sources(
        self,
        task_id: int,
        desired: Iterable[tuple[UUID, str]],
    ) -> bool:
        return await synchronize_task_sources(
            self.session,
            task_id,
            desired,
        )

    async def get_task_source(
        self, task_id: int, source_id: UUID
    ) -> TaskSource | None:
        return await self.session.scalar(
            select(TaskSource).where(
                TaskSource.task_id == task_id,
                TaskSource.source_id == source_id,
            )
        )

    async def list_task_sources(self, task_id: int) -> list[TaskSource]:
        result = await self.session.scalars(
            select(TaskSource)
            .where(TaskSource.task_id == task_id)
            .order_by(TaskSource.created_at.asc(), TaskSource.source_id.asc())
        )
        return list(result)

    async def list_sources_for_task(
        self, task_id: int
    ) -> list[MonitoringSource]:
        result = await self.session.scalars(
            select(MonitoringSource)
            .join(TaskSource, TaskSource.source_id == MonitoringSource.id)
            .where(TaskSource.task_id == task_id)
            .order_by(
                MonitoringSource.provider.asc(),
                MonitoringSource.source_type.asc(),
                MonitoringSource.external_id.asc(),
                MonitoringSource.id.asc(),
            )
        )
        return list(result)

    async def list_sources_by_ids(
        self, source_ids: Iterable[UUID]
    ) -> list[MonitoringSource]:
        ids = list(source_ids)
        if not ids:
            return []
        result = await self.session.scalars(
            select(MonitoringSource)
            .where(MonitoringSource.id.in_(ids))
            .order_by(
                MonitoringSource.provider.asc(),
                MonitoringSource.source_type.asc(),
                MonitoringSource.external_id.asc(),
                MonitoringSource.id.asc(),
            )
        )
        return list(result)

"""Access-scope repository: scope CRUD and ref-counted scope/source access."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AccessScope, ScopeSourceAccess, utcnow


class ScopeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_access_scope(self, scope: AccessScope) -> AccessScope:
        self.session.add(scope)
        await self.session.flush()
        await self.session.refresh(scope)
        return scope

    async def get_access_scope(self, scope_id: UUID) -> AccessScope | None:
        return await self.session.get(AccessScope, scope_id)

    async def list_access_scopes(self, owner_user_id: str) -> list[AccessScope]:
        result = await self.session.scalars(
            select(AccessScope)
            .where(AccessScope.owner_user_id == owner_user_id)
            .order_by(AccessScope.created_at.desc())
        )
        return list(result)

    async def get_scope_source(
        self,
        scope_id: UUID,
        source_id: UUID,
        *,
        for_update: bool = False,
    ) -> ScopeSourceAccess | None:
        statement = select(ScopeSourceAccess).where(
            ScopeSourceAccess.access_scope_id == scope_id,
            ScopeSourceAccess.source_id == source_id,
        )
        if for_update:
            statement = statement.with_for_update()
        return await self.session.scalar(statement)

    async def grant_scope_source(
        self, scope_id: UUID, source_id: UUID
    ) -> ScopeSourceAccess:
        """Atomically insert or re-activate ref-counted access."""
        statement = (
            insert(ScopeSourceAccess)
            .values(
                access_scope_id=scope_id,
                source_id=source_id,
                ref_count=1,
            )
            .on_conflict_do_update(
                index_elements=[
                    ScopeSourceAccess.access_scope_id,
                    ScopeSourceAccess.source_id,
                ],
                set_={
                    "ref_count": ScopeSourceAccess.ref_count + 1,
                    "revoked_at": None,
                    "revoked_by": None,
                },
            )
            .returning(ScopeSourceAccess)
        )
        access = await self.session.scalar(statement)
        if access is None:
            raise RuntimeError("scope/source grant did not return a row")
        await self.session.flush()
        return access

    async def decrement_scope_ref(self, scope_id: UUID, source_id: UUID) -> None:
        access = await self.get_scope_source(scope_id, source_id, for_update=True)
        if access is None:
            return
        access.ref_count = max(0, access.ref_count - 1)
        await self.session.flush()

    async def revoke_scope_source(
        self, scope_id: UUID, source_id: UUID, revoked_by: str
    ) -> ScopeSourceAccess | None:
        """Administratively revoke all effective access and retain a tombstone."""
        access = await self.get_scope_source(scope_id, source_id, for_update=True)
        if access is None:
            return None
        access.ref_count = 0
        access.revoked_at = utcnow()
        access.revoked_by = revoked_by
        await self.session.flush()
        await self.session.refresh(access)
        return access

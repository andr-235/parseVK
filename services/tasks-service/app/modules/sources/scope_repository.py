"""Access-scope repository: scope CRUD and ref-counted scope/source access.

Access semantics (issue #283 AC):
- scope/source access uses reference counting (ref_count);
- revoke marks a tombstone (revoked_at/revoked_by), never hard delete;
- grant after revoke re-activates the row.
"""

from uuid import UUID

from sqlalchemy import select
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
        self, scope_id: UUID, source_id: UUID
    ) -> ScopeSourceAccess | None:
        return await self.session.scalar(
            select(ScopeSourceAccess).where(
                ScopeSourceAccess.access_scope_id == scope_id,
                ScopeSourceAccess.source_id == source_id,
            )
        )

    async def grant_scope_source(
        self, scope_id: UUID, source_id: UUID
    ) -> ScopeSourceAccess:
        """Insert or re-activate access; ref_count incremented by service."""
        access = await self.get_scope_source(scope_id, source_id)
        if access is None:
            access = ScopeSourceAccess(access_scope_id=scope_id, source_id=source_id, ref_count=1)
            self.session.add(access)
        else:
            access.ref_count += 1
            access.revoked_at = None
            access.revoked_by = None
        await self.session.flush()
        await self.session.refresh(access)
        return access

    async def decrement_scope_ref(self, scope_id: UUID, source_id: UUID) -> None:
        access = await self.get_scope_source(scope_id, source_id)
        if access is None:
            return
        access.ref_count = max(0, access.ref_count - 1)
        await self.session.flush()

    async def revoke_scope_source(
        self, scope_id: UUID, source_id: UUID, revoked_by: str
    ) -> ScopeSourceAccess | None:
        """Mark tombstone (revoked_at/revoked_by) instead of hard delete."""
        access = await self.get_scope_source(scope_id, source_id)
        if access is None:
            return None
        access.ref_count = 0
        access.revoked_at = utcnow()
        access.revoked_by = revoked_by
        await self.session.flush()
        await self.session.refresh(access)
        return access

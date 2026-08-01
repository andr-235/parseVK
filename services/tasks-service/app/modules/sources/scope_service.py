"""Access scope service: business rules for scopes and grant/revoke.

External identities are resolved through the shared canonical path; access
scopes are owned by their creator; revoke marks a tombstone via the
reference-counted repository (issue #283 AC).
"""

import logging
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AccessScope
from app.modules.sources.errors import ScopeNotFoundError
from app.modules.sources.identity import canonical_source
from app.modules.sources.repository import SourcesRepository
from app.modules.sources.resolver import SourceIdentity, SourceResolver
from app.modules.sources.schemas import CreateAccessScopeRequest, GrantAccessRequest
from app.modules.sources.scope_repository import ScopeRepository

logger = logging.getLogger(__name__)


class AccessScopeService:
    def __init__(
        self,
        session: AsyncSession,
        resolver: SourceResolver,
        scope_repo: ScopeRepository | None = None,
        sources_repo: SourcesRepository | None = None,
    ):
        self.session = session
        self.resolver = resolver
        self.scope_repo = scope_repo or ScopeRepository(session)
        self.sources_repo = sources_repo or SourcesRepository(session)

    async def create_access_scope(
        self, owner_user_id: str, request: CreateAccessScopeRequest
    ) -> AccessScope:
        scope = AccessScope(
            id=uuid4(),
            owner_user_id=owner_user_id,
            name=request.name,
            created_by_user_id=owner_user_id,
        )
        scope = await self.scope_repo.create_access_scope(scope)
        logger.info("Access scope created: id=%s name=%s", scope.id, scope.name)
        return scope

    async def list_access_scopes(self, owner_user_id: str) -> list[AccessScope]:
        return await self.scope_repo.list_access_scopes(owner_user_id)

    async def _require_scope(self, scope_id: UUID, owner_user_id: str) -> AccessScope:
        scope = await self.scope_repo.get_access_scope(scope_id)
        if scope is None or scope.owner_user_id != owner_user_id:
            raise ScopeNotFoundError(f"Access scope {scope_id} not found")
        return scope

    async def grant_access(
        self, owner_user_id: str, scope_id: UUID, request: GrantAccessRequest
    ) -> None:
        await self._require_scope(scope_id, owner_user_id)
        identity = SourceIdentity(request.provider, request.source_type, request.external_id)
        source = await canonical_source(self.resolver, self.sources_repo, identity)
        access = await self.scope_repo.grant_scope_source(scope_id, source.id)
        logger.info(
            "source access granted",
            extra={"scope_id": str(scope_id), "source_id": str(source.id),
                   "ref_count": access.ref_count},
        )

    async def revoke_access(
        self, owner_user_id: str, scope_id: UUID, request: GrantAccessRequest
    ) -> None:
        await self._require_scope(scope_id, owner_user_id)
        identity = SourceIdentity(request.provider, request.source_type, request.external_id)
        source = await canonical_source(self.resolver, self.sources_repo, identity)
        await self.scope_repo.revoke_scope_source(scope_id, source.id, owner_user_id)
        logger.info(
            "source access revoked (tombstone)",
            extra={"scope_id": str(scope_id), "source_id": str(source.id),
                   "revoked_by": owner_user_id},
        )

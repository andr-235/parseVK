from uuid import UUID

from app.db.models import RefreshToken, utc_now
from app.modules.outbox.service import add_identity_event
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class RefreshTokensRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_by_hash(self, token_hash: str) -> RefreshToken | None:
        return await self.session.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )

    async def save_token(self, token: RefreshToken) -> None:
        self.session.add(token)
        await self.session.flush()

    async def revoke_family(self, token_family_id: UUID) -> None:
        tokens = await self.session.scalars(
            select(RefreshToken).where(
                RefreshToken.token_family_id == token_family_id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        now = utc_now()
        for token in tokens:
            token.revoked_at = now


class OutboxRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_identity_event(self, event_type: str, user_id: str) -> None:
        await add_identity_event(self.session, event_type=event_type, user_id=user_id)

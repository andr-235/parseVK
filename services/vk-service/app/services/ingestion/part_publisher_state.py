from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)
from app.infrastructure.db.repositories.ingestion_part_publication import (
    SqlAlchemyIngestionPartPublicationRepository,
)


class PartPublisherStateStore:
    def __init__(
        self,
        session_factory: async_sessionmaker[AsyncSession],
    ) -> None:
        self.session_factory = session_factory

    async def recover(self, *, limit: int) -> int:
        async with self.session_factory() as session:
            async with session.begin():
                return await SqlAlchemyIngestionPartPublicationRepository(
                    session
                ).recover_missing_references(limit=limit)

    async def claim(
        self,
        *,
        worker_id: str,
        batch_size: int,
        lease_expires_at: datetime,
    ) -> tuple[IngestionPartPublicationClaim, ...]:
        async with self.session_factory() as session:
            async with session.begin():
                claims = await SqlAlchemyIngestionPartPublicationRepository(
                    session
                ).claim_pending(
                    worker_id=worker_id,
                    limit=batch_size,
                    lease_expires_at=lease_expires_at,
                )
        return claims

    async def published(
        self,
        claim: IngestionPartPublicationClaim,
        at: datetime,
    ) -> None:
        async with self.session_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionPartPublicationRepository(
                    session
                ).mark_published(
                    claim_id=claim.claim_id,
                    part_id=claim.part.message_id,
                    wire_digest=claim.part.wire_digest,
                    published_at=at,
                )

    async def retry(
        self,
        claim: IngestionPartPublicationClaim,
        *,
        error: str,
        at: datetime,
        delay_seconds: float,
    ) -> None:
        async with self.session_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionPartPublicationRepository(
                    session
                ).release_for_retry(
                    claim_id=claim.claim_id,
                    part_id=claim.part.message_id,
                    error=error,
                    next_attempt_at=at + timedelta(seconds=delay_seconds),
                )

    async def failed(
        self,
        claim: IngestionPartPublicationClaim,
        *,
        error: str,
        at: datetime,
    ) -> None:
        async with self.session_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionPartPublicationRepository(session).mark_failed(
                    claim_id=claim.claim_id,
                    part_id=claim.part.message_id,
                    error=error,
                    failed_at=at,
                )

    async def quarantined(
        self,
        claim: IngestionPartPublicationClaim,
        *,
        reason: str,
        at: datetime,
    ) -> None:
        async with self.session_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionPartPublicationRepository(session).quarantine(
                    claim_id=claim.claim_id,
                    part_id=claim.part.message_id,
                    reason=reason,
                    quarantined_at=at,
                )

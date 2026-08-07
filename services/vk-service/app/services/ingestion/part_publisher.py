import asyncio
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)
from app.domain.ports.ingestion_part_transport import IngestionPartTransport
from app.domain.repositories.ingestion_part_publication import (
    IngestionPartPublicationIntegrityError,
)
from app.infrastructure.db.repositories.ingestion_part_publication import (
    SqlAlchemyIngestionPartPublicationRepository,
)
from app.services.ingestion.part_publication_verifier import (
    verify_publication_claim,
)


@dataclass(frozen=True, slots=True)
class PartPublishResult:
    recovered: int = 0
    claimed: int = 0
    published: int = 0
    retried: int = 0
    failed: int = 0
    quarantined: int = 0


class StagedIngestionPartPublisher:
    def __init__(
        self,
        *,
        session_factory: async_sessionmaker[AsyncSession],
        transport: IngestionPartTransport,
        topic: str,
        worker_id: str,
        batch_size: int,
        lease_seconds: int,
        max_attempts: int,
        retry_base_seconds: float,
        retry_max_seconds: float,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        if not topic:
            raise ValueError("publication topic must not be empty")
        if max_attempts < 1:
            raise ValueError("max_attempts must be positive")
        self.session_factory = session_factory
        self.transport = transport
        self.topic = topic
        self.worker_id = worker_id
        self.batch_size = batch_size
        self.lease_seconds = lease_seconds
        self.max_attempts = max_attempts
        self.retry_base_seconds = retry_base_seconds
        self.retry_max_seconds = retry_max_seconds
        self.clock = clock or (lambda: datetime.now(UTC))

    async def publish_once(self) -> PartPublishResult:
        recovered, claims = await self._claim()
        result = PartPublishResult(recovered=recovered, claimed=len(claims))
        for claim in claims:
            outcome = await self._publish_claim(claim)
            result = PartPublishResult(
                recovered=result.recovered,
                claimed=result.claimed,
                published=result.published + int(outcome == "published"),
                retried=result.retried + int(outcome == "retried"),
                failed=result.failed + int(outcome == "failed"),
                quarantined=result.quarantined + int(outcome == "quarantined"),
            )
        return result

    async def _claim(self) -> tuple[int, tuple[IngestionPartPublicationClaim, ...]]:
        now = self._now()
        async with self.session_factory() as session:
            async with session.begin():
                repository = SqlAlchemyIngestionPartPublicationRepository(session)
                recovered = await repository.recover_missing_references(
                    limit=self.batch_size
                )
                claims = await repository.claim_pending(
                    worker_id=self.worker_id,
                    limit=self.batch_size,
                    lease_expires_at=now + timedelta(seconds=self.lease_seconds),
                )
        return recovered, claims

    async def _publish_claim(self, claim: IngestionPartPublicationClaim) -> str:
        try:
            verified = verify_publication_claim(claim)
            await self.transport.send_and_wait(
                self.topic,
                value=verified.part.wire_bytes,
                key=verified.kafka_key.encode("utf-8"),
                headers=_headers(verified),
            )
        except IngestionPartPublicationIntegrityError as error:
            await self._quarantine(claim, str(error))
            return "quarantined"
        except asyncio.CancelledError:
            raise
        except Exception as error:
            if claim.attempts >= self.max_attempts:
                await self._fail(claim, str(error))
                return "failed"
            await self._retry(claim, str(error))
            return "retried"
        await self._published(claim)
        return "published"

    async def _published(self, claim: IngestionPartPublicationClaim) -> None:
        now = self._now()
        async with self.session_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionPartPublicationRepository(
                    session
                ).mark_published(
                    claim_id=claim.claim_id,
                    part_id=claim.part.message_id,
                    wire_digest=claim.part.wire_digest,
                    published_at=now,
                )

    async def _retry(self, claim: IngestionPartPublicationClaim, error: str) -> None:
        delay = min(
            self.retry_base_seconds * (2 ** max(claim.attempts - 1, 0)),
            self.retry_max_seconds,
        )
        async with self.session_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionPartPublicationRepository(
                    session
                ).release_for_retry(
                    claim_id=claim.claim_id,
                    part_id=claim.part.message_id,
                    error=error,
                    next_attempt_at=self._now() + timedelta(seconds=delay),
                )

    async def _fail(self, claim: IngestionPartPublicationClaim, error: str) -> None:
        async with self.session_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionPartPublicationRepository(session).mark_failed(
                    claim_id=claim.claim_id,
                    part_id=claim.part.message_id,
                    error=error,
                    failed_at=self._now(),
                )

    async def _quarantine(
        self,
        claim: IngestionPartPublicationClaim,
        reason: str,
    ) -> None:
        async with self.session_factory() as session:
            async with session.begin():
                await SqlAlchemyIngestionPartPublicationRepository(session).quarantine(
                    claim_id=claim.claim_id,
                    part_id=claim.part.message_id,
                    reason=reason,
                    quarantined_at=self._now(),
                )

    def _now(self) -> datetime:
        value = self.clock()
        if value.tzinfo is None:
            raise ValueError("publisher clock must return timezone-aware values")
        return value


def _headers(claim: IngestionPartPublicationClaim) -> list[tuple[str, bytes]]:
    return [
        ("event-id", str(claim.event_id).encode()),
        ("event-type", claim.event_type.encode()),
        ("batch-id", str(claim.batch.batch_id).encode()),
        ("wire-digest", claim.part.wire_digest.encode()),
    ]

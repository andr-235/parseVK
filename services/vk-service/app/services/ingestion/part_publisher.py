import asyncio
from collections.abc import Callable
from dataclasses import dataclass, replace
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)
from app.domain.ports.ingestion_part_transport import IngestionPartTransport
from app.domain.repositories.ingestion_part_publication import (
    IngestionPartPublicationIntegrityError,
)
from app.services.ingestion.part_publication_verifier import (
    verify_publication_claim,
)
from app.services.ingestion.part_publisher_contract import (
    publication_headers,
    validate_publisher_settings,
)
from app.services.ingestion.part_publisher_state import PartPublisherStateStore


@dataclass(frozen=True, slots=True)
class PartPublishResult:
    recovered: int = 0
    claimed: int = 0
    published: int = 0
    retried: int = 0
    failed: int = 0
    quarantined: int = 0

    def increment(self, outcome: str) -> "PartPublishResult":
        if outcome not in {"published", "retried", "failed", "quarantined"}:
            raise ValueError("unsupported publication outcome")
        return replace(self, **{outcome: getattr(self, outcome) + 1})


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
        validate_publisher_settings(
            topic=topic,
            worker_id=worker_id,
            batch_size=batch_size,
            lease_seconds=lease_seconds,
            max_attempts=max_attempts,
            retry_base_seconds=retry_base_seconds,
            retry_max_seconds=retry_max_seconds,
        )
        self.state = PartPublisherStateStore(session_factory)
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
        recovered = await self.state.recover(limit=self.batch_size)
        result = PartPublishResult(recovered=recovered)

        for _ in range(self.batch_size):
            now = self._now()
            claims = await self.state.claim(
                worker_id=self.worker_id,
                batch_size=1,
                lease_expires_at=now + timedelta(seconds=self.lease_seconds),
            )
            if not claims:
                break

            claim = claims[0]
            result = replace(result, claimed=result.claimed + 1)
            outcome = await self._publish_claim(claim)
            result = result.increment(outcome)
            if outcome in {"retried", "failed"}:
                break
        return result

    async def _publish_claim(self, claim: IngestionPartPublicationClaim) -> str:
        try:
            verified = verify_publication_claim(claim)
            await self.transport.send_and_wait(
                self.topic,
                value=verified.part.wire_bytes,
                key=verified.kafka_key.encode("utf-8"),
                headers=publication_headers(verified),
            )
        except IngestionPartPublicationIntegrityError as error:
            await self.state.quarantined(
                claim,
                reason=_error_reason(error),
                at=self._now(),
            )
            return "quarantined"
        except asyncio.CancelledError:
            raise
        except Exception as error:
            reason = _error_reason(error)
            if claim.attempts >= self.max_attempts:
                await self.state.failed(claim, error=reason, at=self._now())
                return "failed"
            await self.state.retry(
                claim,
                error=reason,
                at=self._now(),
                delay_seconds=self._retry_delay(claim.attempts),
            )
            return "retried"
        await self.state.published(claim, self._now())
        return "published"

    def _retry_delay(self, attempts: int) -> float:
        return min(
            self.retry_base_seconds * (2 ** max(attempts - 1, 0)),
            self.retry_max_seconds,
        )

    def _now(self) -> datetime:
        value = self.clock()
        if value.tzinfo is None:
            raise ValueError("publisher clock must return timezone-aware values")
        return value


def _error_reason(error: Exception) -> str:
    return str(error).strip() or type(error).__name__

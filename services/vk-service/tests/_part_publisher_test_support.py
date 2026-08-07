from datetime import UTC, datetime

from app.infrastructure.db.session import SessionLocal
from app.services.ingestion.part_publisher import StagedIngestionPartPublisher


class RecordingTransport:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error
        self.calls: list[dict] = []

    async def send_and_wait(
        self,
        topic: str,
        *,
        value: bytes,
        key: bytes,
        headers: list[tuple[str, bytes]],
    ) -> object:
        self.calls.append(
            {
                "topic": topic,
                "value": value,
                "key": key,
                "headers": headers,
            }
        )
        if self.error is not None:
            raise self.error
        return {"offset": len(self.calls) - 1}


def build_publisher(
    transport: RecordingTransport,
    *,
    now: datetime | None = None,
    max_attempts: int = 3,
) -> StagedIngestionPartPublisher:
    timestamp = now or datetime.now(UTC)
    return StagedIngestionPartPublisher(
        session_factory=SessionLocal,
        transport=transport,
        topic="parsevk.content.ingestion.vk",
        worker_id="publisher-test",
        batch_size=10,
        lease_seconds=90,
        max_attempts=max_attempts,
        retry_base_seconds=2,
        retry_max_seconds=60,
        clock=lambda: timestamp,
    )

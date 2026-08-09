from app.domain.entities.ingestion_part_publication import (
    IngestionPartPublicationClaim,
)


def publication_headers(
    claim: IngestionPartPublicationClaim,
) -> list[tuple[str, bytes]]:
    return [
        ("event-id", str(claim.event_id).encode()),
        ("event-type", claim.event_type.encode()),
        ("source-service", b"vk-service"),
        ("batch-id", str(claim.batch.batch_id).encode()),
        ("wire-digest", claim.part.wire_digest.encode()),
        ("page-digest", claim.batch.payload_digest.encode()),
        ("part-digest", claim.part.part_digest.encode()),
    ]


def validate_publisher_settings(
    *,
    topic: str,
    worker_id: str,
    batch_size: int,
    lease_seconds: int,
    max_attempts: int,
    retry_base_seconds: float,
    retry_max_seconds: float,
) -> None:
    if not topic or not worker_id:
        raise ValueError("publisher topic and worker_id must not be empty")
    for name, value in (
        ("batch_size", batch_size),
        ("lease_seconds", lease_seconds),
        ("max_attempts", max_attempts),
    ):
        if value < 1:
            raise ValueError(f"{name} must be positive")
    if retry_base_seconds <= 0:
        raise ValueError("retry_base_seconds must be positive")
    if retry_max_seconds < retry_base_seconds:
        raise ValueError("retry_max_seconds must not be below retry_base_seconds")

"""Persistence operations for durable Kafka consumer retries."""

from datetime import UTC, datetime, timedelta


async def record_retry_failure(
    *,
    session_factory,
    repository,
    event_id: str,
    event_type: str,
    failure_reason: str,
) -> tuple[int, datetime]:
    async with session_factory() as session:
        async with session.begin():
            current = await repository.get_retry_count(session, event_id)
            retry_count = (current or 0) + 1
            now = datetime.now(UTC)
            next_retry = now + timedelta(
                seconds=min(2**retry_count, 60)
            )
            await repository.upsert_retry(
                session,
                event_id,
                event_type,
                failure_reason,
                next_retry,
                now,
            )
        stored_count = await repository.get_retry_count(session, event_id)
    return stored_count or retry_count, next_retry

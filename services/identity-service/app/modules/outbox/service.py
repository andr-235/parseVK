<<<<<<< HEAD
from common.events import EventEnvelope
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.outbox.repository import add_event

=======
from app.modules.outbox.repository import add_event
from common.events import EventEnvelope
from sqlalchemy.ext.asyncio import AsyncSession

>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da

async def add_identity_event(
    session: AsyncSession,
    *,
    event_type: str,
    user_id: str,
    correlation_id: str | None = None,
) -> None:
    await add_event(
        session,
        EventEnvelope(
            event_type=event_type,
            producer="identity-service",
            correlation_id=correlation_id,
            payload={"user_id": user_id},
        ),
        aggregate_type="user",
        aggregate_id=user_id,
    )

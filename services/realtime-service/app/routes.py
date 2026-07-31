from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import text

from app.core.config import settings
from app.db.session import SessionLocal as session_factory
from app.modules.stream.dependencies import verify_internal_token
from app.modules.stream.listener import RealtimeListener
from app.modules.stream.sse_handler import stream_events


def create_router(
    realtime_listener: RealtimeListener,
    consumer_healthy: list[bool],
) -> APIRouter:
    router = APIRouter()

    @router.get("/health")
    async def health() -> dict[str, str]:
        result: dict[str, str] = {"status": "UP"}
        if settings.kafka_consumer_enabled:
            result["kafkaConsumer"] = "healthy" if consumer_healthy[0] else "unhealthy"
        return result

    @router.get("/ready")
    async def ready() -> dict[str, str]:
        from app.db.session import engine

        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "READY"}
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Database is not ready: {exc}",
            ) from exc

    @router.get(
        "/internal/realtime/stream",
        dependencies=[Depends(verify_internal_token)],
    )
    async def realtime_stream(
        lastEventId: int | None = None,
        audienceType: str | None = None,
        audienceId: str | None = None,
        x_user_id: str | None = Header(default=None, alias="X-User-ID"),
    ) -> StreamingResponse:
        audience_types = (
            [item.strip() for item in audienceType.split(",")] if audienceType else None
        )

        return StreamingResponse(
            stream_events(
                session_factory,
                lastEventId,
                audience_types,
                audienceId,
                x_user_id,
                realtime_listener,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    return router

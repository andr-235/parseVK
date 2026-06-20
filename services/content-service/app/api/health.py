from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import text

from app.infrastructure.db.session import engine

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "UP"}


@router.get("/ready")
async def ready(request: Request) -> dict[str, str]:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        workers = getattr(request.app.state, "workers", None)
        if workers and not workers.healthy:
            raise RuntimeError("Projection workers are paused")
        return {"status": "READY"}
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Database is not ready: {exc}",
        ) from exc

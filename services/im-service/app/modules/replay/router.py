import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import settings
from app.core.security import require_internal_token
from app.db.session import SessionLocal
from app.modules.replay.processor import ReplayBatchProcessor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/replay", tags=["replay"])


def _check_replay_enabled() -> None:
    if not settings.replay_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Replay is disabled. Set IM_SERVICE_REPLAY_ENABLED=true to enable.",
        )


@router.post("/run")
async def replay_run(
    batch_size: int = Query(default=100, ge=1, le=1000),
    token: str = Depends(require_internal_token),
) -> dict:
    """Run a single replay batch. Returns batch result."""
    _check_replay_enabled()
    processor = ReplayBatchProcessor(SessionLocal)
    result = await processor.run_batch(batch_size=batch_size)
    return {
        "processedCount": result.processed_count,
        "lastImMessageId": result.last_im_message_id,
        "hasMore": result.has_more,
    }


@router.post("/run-full")
async def replay_run_full(
    batch_size: int = Query(default=100, ge=1, le=1000),
    max_batches: int | None = Query(default=None, ge=1),
    token: str = Depends(require_internal_token),
) -> dict:
    """Run replay to completion (all batches). Blocks until done."""
    _check_replay_enabled()
    processor = ReplayBatchProcessor(SessionLocal)
    await processor.run_full(batch_size=batch_size, max_batches=max_batches)
    return {"status": "completed"}

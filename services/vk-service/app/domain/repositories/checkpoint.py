import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class CheckpointData:
    run_id: str
    owner_id: int
    post_id: int
    task_id: int
    group_id: int
    next_offset: int = 0
    last_comment_id: int | None = None
    last_comment_date: datetime | None = None
    processed_comments: int = 0
    status: str = "in_progress"
    last_error: str | None = None


class IngestionCheckpointStore(ABC):
    """Domain port for checkpoint persistence."""

    @abstractmethod
    async def load(self, run_id: str, owner_id: int, post_id: int) -> CheckpointData | None:
        logger.debug("Called IngestionCheckpointStore.load(run_id=%s, owner_id=%d, post_id=%d)", run_id, owner_id, post_id)
        ...

    @abstractmethod
    async def save(self, checkpoint: CheckpointData) -> None:
        logger.debug("Called IngestionCheckpointStore.save(run_id=%s, owner_id=%d, post_id=%d)", checkpoint.run_id, checkpoint.owner_id, checkpoint.post_id)
        ...

    @abstractmethod
    async def complete(self, run_id: str, owner_id: int, post_id: int) -> None:
        logger.debug("Called IngestionCheckpointStore.complete(run_id=%s, owner_id=%d, post_id=%d)", run_id, owner_id, post_id)
        ...

    @abstractmethod
    async def fail(self, run_id: str, owner_id: int, post_id: int, error: str) -> None:
        logger.debug("Called IngestionCheckpointStore.fail(run_id=%s, owner_id=%d, post_id=%d, error=%s)", run_id, owner_id, post_id, error)
        ...

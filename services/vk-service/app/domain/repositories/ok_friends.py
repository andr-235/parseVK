import uuid
from abc import ABC, abstractmethod
from typing import Any, Sequence
from app.domain.models.ok_friends import OkFriendsExportJob, OkFriendsJobLog

class OkFriendsRepository(ABC):
    @abstractmethod
    async def create_job(self, params: dict, ok_user_id: int | None = None) -> OkFriendsExportJob:
        """Create a new OK friends export job record and add starting log."""

    @abstractmethod
    async def get_job_by_id(self, job_id: uuid.UUID) -> OkFriendsExportJob | None:
        """Retrieve job record by UUID."""

    @abstractmethod
    async def get_job_logs(self, job_id: uuid.UUID, limit: int = 200) -> Sequence[OkFriendsJobLog]:
        """Fetch job logs ordered by creation timestamp."""

    @abstractmethod
    async def update_progress(self, job_id: uuid.UUID, fetched_count: int, total_count: int | None = None, warning: str | None = None) -> None:
        """Atomically update progress fields of a job."""

    @abstractmethod
    async def complete_job(self, job_id: uuid.UUID, fetched_count: int, total_count: int | None, warning: str | None, xlsx_path: str) -> None:
        """Transition job status to DONE and save final output path."""

    @abstractmethod
    async def fail_job(self, job_id: uuid.UUID, error: str, fetched_count: int, total_count: int | None = None, warning: str | None = None) -> None:
        """Transition job status to FAILED and store exception message."""

    @abstractmethod
    async def save_friends_batch(self, job_id: uuid.UUID, records: list[dict]) -> None:
        """Save a batch of friend profiles records to database."""

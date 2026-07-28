"""Application service for execution event transitions.

Each apply_* method updates the Task aggregate within an active transaction
and appends canonical outbox events.
"""

import logging
from datetime import UTC, datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.execution_events.handlers import (
    apply_completed,
    apply_failed,
    apply_progressed,
    apply_started,
)

logger = logging.getLogger(__name__)


class ExecutionEventService:
    """Handles domain transitions for execution events."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def apply_started(
        self,
        task_id: int,
        run_id: str,
        execution_sequence: int,
        owner_user_id: str,
    ) -> bool:
        """Apply task.execution_started transition.

        Returns True if applied, False if skipped (stale/terminal/wrong run).
        """
        return await apply_started(
            self.session, task_id, run_id, execution_sequence, owner_user_id
        )

    async def apply_progressed(
        self,
        task_id: int,
        run_id: str,
        execution_sequence: int,
        processed_items: int,
        total_items: int,
        progress: float,
        stats: Optional[dict],
        owner_user_id: str,
    ) -> bool:
        """Apply task.execution_progressed transition."""
        return await apply_progressed(
            self.session,
            task_id,
            run_id,
            execution_sequence,
            processed_items,
            total_items,
            progress,
            stats,
            owner_user_id,
        )

    async def apply_completed(
        self,
        task_id: int,
        run_id: str,
        execution_sequence: int,
        processed_items: int,
        total_items: int,
        stats: Optional[dict],
        owner_user_id: str,
    ) -> bool:
        """Apply task.execution_completed transition."""
        return await apply_completed(
            self.session,
            task_id,
            run_id,
            execution_sequence,
            processed_items,
            total_items,
            stats,
            owner_user_id,
        )

    async def apply_failed(
        self,
        task_id: int,
        run_id: str,
        execution_sequence: int,
        processed_items: int,
        total_items: int,
        stats: Optional[dict],
        error: str,
        failure_kind: str,
        owner_user_id: str,
    ) -> bool:
        """Apply task.execution_failed transition."""
        return await apply_failed(
            self.session,
            task_id,
            run_id,
            execution_sequence,
            processed_items,
            total_items,
            stats,
            error,
            failure_kind,
            owner_user_id,
        )

    @staticmethod
    def now_iso() -> str:
        """Canonical UTC timestamp for outbox payloads."""
        return datetime.now(UTC).isoformat()

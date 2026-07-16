"""WorkerHealth dataclass for typed background worker diagnostics.

Replaces list[bool] health flags with a structured dataclass that tracks
running state, last success timestamp, and last error message.
"""

from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass
class WorkerHealth:
    """Typed health state for a background worker.

    Properties:
        running: True if the worker is currently running.
        last_success_at: UTC timestamp of the last successful cycle.
        last_error: Error message from the last failure, if any.
        is_healthy: True when running AND at least one success recorded.
    """
    running: bool = False
    last_success_at: datetime | None = None
    last_error: str | None = None

    @property
    def is_healthy(self) -> bool:
        """Worker is healthy when running and had at least one success."""
        return self.running and self.last_success_at is not None

    def mark_started(self) -> None:
        """Mark worker as started (running=True)."""
        self.running = True

    def mark_success(self) -> None:
        """Mark a successful cycle. Sets running=True, updates last_success_at, clears error."""
        self.running = True
        self.last_success_at = datetime.now(UTC)
        self.last_error = None

    def mark_error(self, error: str) -> None:
        """Mark an error. Sets running=False, records error message."""
        self.running = False
        self.last_error = error

    def mark_stopped(self) -> None:
        """Mark worker as stopped (running=False)."""
        self.running = False

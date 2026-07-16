"""WorkerHealth dataclass for typed background worker diagnostics.

Tracks five lifecycle states: started, cycle_success, cycle_error,
crashed, and stopped. Designed to be passed to both the supervisor
(which marks start/crash/stop) and the worker (which marks cycle
success/error).
"""

from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass
class WorkerHealth:
    """Typed health state for a background worker.

    Properties:
        running: True if the worker is currently running.
        last_cycle_success_at: UTC timestamp of the last successful cycle.
        last_cycle_error: Error message from the last recoverable cycle error.
        last_crash: Error message from the last crash (unhandled exception).
        is_healthy: True when running, had at least one success, and no active error or crash.
    """
    running: bool = False
    last_cycle_success_at: datetime | None = None
    last_cycle_error: str | None = None
    last_crash: str | None = None

    @property
    def is_healthy(self) -> bool:
        """Worker is healthy when running, has completed at least one successful
        cycle, and has no active cycle error or crash."""
        return (
            self.running
            and self.last_cycle_success_at is not None
            and self.last_cycle_error is None
            and self.last_crash is None
        )

    def mark_started(self) -> None:
        """Mark worker as started (running=True)."""
        self.running = True

    def mark_cycle_success(self) -> None:
        """Mark a successful cycle. Updates timestamp, clears cycle error."""
        self.running = True
        self.last_cycle_success_at = datetime.now(UTC)
        self.last_cycle_error = None

    def mark_cycle_error(self, error: str) -> None:
        """Mark a recoverable cycle error. Worker continues running.

        Unlike mark_crashed(), this does NOT set running=False because
        the worker caught the error internally and continues its loop.
        """
        self.running = True
        self.last_cycle_error = error

    def mark_crashed(self, error: str) -> None:
        """Mark a crash. Worker stopped and will be restarted by supervisor.

        Sets running=False because the worker terminated unexpectedly.
        """
        self.running = False
        self.last_crash = error

    def mark_stopped(self) -> None:
        """Mark worker as gracefully stopped (running=False)."""
        self.running = False

"""Tests for WorkerHealth dataclass — lifecycle states and health contract.

Tests are synchronous (pure dataclass state, no async needed).
Root pyproject.toml sets asyncio_mode=auto, but these tests don't need it.
"""

from common.runtime.health import WorkerHealth


def test_initial_state():
    """New WorkerHealth is not healthy — no running, no success."""
    h = WorkerHealth()
    assert h.running is False
    assert h.last_cycle_success_at is None
    assert h.last_cycle_error is None
    assert h.last_crash is None
    assert h.is_healthy is False


def test_mark_started():
    """mark_started() sets running=True but is_healthy is still False."""
    h = WorkerHealth()
    h.mark_started()
    assert h.running is True
    assert h.is_healthy is False  # no cycle success yet


def test_mark_cycle_success():
    """mark_cycle_success() sets running, timestamp, clears error, is_healthy=True."""
    h = WorkerHealth()
    h.mark_cycle_success()
    assert h.running is True
    assert h.last_cycle_success_at is not None
    assert h.last_cycle_error is None
    assert h.is_healthy is True


def test_mark_cycle_error():
    """mark_cycle_error() keeps running=True (worker continues), sets error, is_healthy=False."""
    h = WorkerHealth()
    h.mark_cycle_success()  # was healthy
    h.mark_cycle_error("cycle failed: timeout")
    assert h.running is True  # stays True — worker continues
    assert h.last_cycle_error == "cycle failed: timeout"
    assert h.is_healthy is False  # last cycle failed
    assert h.last_cycle_success_at is not None  # preserved from earlier success


def test_cycle_success_after_cycle_error():
    """After a cycle error, a new success restores healthy and clears error."""
    h = WorkerHealth()
    h.mark_cycle_error("first attempt failed")
    assert h.is_healthy is False
    h.mark_cycle_success()
    assert h.is_healthy is True
    assert h.last_cycle_error is None  # cleared
    assert h.last_cycle_success_at is not None  # updated


def test_mark_crashed():
    """mark_crashed() sets running=False, records error, is_healthy=False."""
    h = WorkerHealth()
    h.mark_cycle_success()  # was healthy
    h.mark_crashed("unhandled exception: TypeError")
    assert h.running is False  # worker stopped
    assert h.last_crash == "unhandled exception: TypeError"
    assert h.is_healthy is False
    assert h.last_cycle_success_at is not None  # preserved


def test_mark_stopped():
    """mark_stopped() sets running=False, is_healthy=False."""
    h = WorkerHealth()
    h.mark_started()
    h.mark_stopped()
    assert h.running is False
    assert h.is_healthy is False


def test_is_healthy_only_with_success():
    """is_healthy requires both running AND at least one cycle success."""
    h = WorkerHealth()
    h.mark_started()
    assert h.running is True
    assert h.is_healthy is False  # no success yet


def test_started_not_healthy():
    """After mark_started alone, is_healthy is still False."""
    h = WorkerHealth()
    h.mark_started()
    assert h.is_healthy is False

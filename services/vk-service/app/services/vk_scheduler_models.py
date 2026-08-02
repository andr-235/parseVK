"""Scheduler helper types: lane requests, account state and typed failures."""

import asyncio
from collections import deque
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field

RequestCallable = Callable[[], Awaitable[object]]


class RetryExhaustedError(RuntimeError):
    """Raised when a request exhausts its retry budget or elapsed deadline."""

    def __init__(
        self,
        method: str,
        last_error: BaseException,
        attempts: int,
        elapsed: float,
    ):
        self.method = method
        self.last_error = last_error
        self.attempts = attempts
        self.elapsed = elapsed
        super().__init__(
            f"retry budget exhausted for {method} after {attempts} attempts "
            f"({elapsed:.1f}s elapsed)"
        )


@dataclass
class LaneRequest:
    call: RequestCallable
    lane_id: str
    future: asyncio.Future
    not_before: float
    enqueued_at: float
    deadline: float
    attempts: int = 0
    last_error: BaseException | None = None


@dataclass
class AccountState:
    lanes: dict[str, deque[LaneRequest]] = field(default_factory=dict)
    rotation: list[str] = field(default_factory=list)
    rotation_pos: int = 0
    cooldown_until: float | None = None
    next_dispatch_at: float = 0.0
    slot: asyncio.Lock = field(default_factory=asyncio.Lock)
    wake: asyncio.Event = field(default_factory=asyncio.Event)
    dispatcher: asyncio.Task | None = None

    def has_work(self) -> bool:
        return any(self.lanes.get(lane_id) for lane_id in self.rotation)

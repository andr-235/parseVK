"""Fair per-account request scheduler: round-robin lanes + centralized retry.

Deterministic under manual clock injection (time_fn/sleep_fn fakes).
"""

import asyncio
import logging
import time
from collections import deque
from collections.abc import Callable

import httpx

from app.domain.exceptions.vk_api import (
    VkApiAuthError,
    VkApiInfrastructureError,
    VkApiRateLimitError,
)
from app.services.vk_retry_policy import RetryCategory, VkRetryPolicy
from app.services.vk_scheduler_models import AccountState, LaneRequest, RetryExhaustedError

logger = logging.getLogger(__name__)

MetricsHook = Callable[[str, str, str, float, float], None]  # account_id, method, outcome, wait, duration
RetryHook = Callable[[str, int], None]
Outcome = str

OUTCOME_SUCCESS = "success"
OUTCOME_AUTH = "auth"
OUTCOME_RATE_LIMIT = "rate_limit"
OUTCOME_INFRA = "infra"
OUTCOME_DOMAIN = "domain"


class FairScheduler:
    """One scheduler instance per account key; lanes round-robin within an account."""

    def __init__(
        self,
        retry_policy: VkRetryPolicy,
        *,
        time_fn: Callable[[], float] = time.monotonic,
        sleep_fn: Callable[[float], object] = asyncio.sleep,
    ):
        self._policy = retry_policy
        self._time = time_fn
        self._sleep = sleep_fn
        self._accounts: dict[str, AccountState] = {}
        self._create_lock = asyncio.Lock()
        self.metrics_hook: MetricsHook | None = None
        self.retry_hook: RetryHook | None = None

    async def execute(self, account_id: str, lane_id: str, call) -> object:
        state = self._accounts.setdefault(account_id, AccountState())
        async with self._create_lock:
            if state.dispatcher is None or state.dispatcher.done():
                state.dispatcher = asyncio.create_task(self._dispatch(account_id, state))

        now = self._time()
        loop = asyncio.get_running_loop()
        request = LaneRequest(
            call=call,
            lane_id=lane_id,
            future=loop.create_future(),
            not_before=now,
            enqueued_at=now,
            deadline=now + self._policy.max_elapsed_seconds(),
        )
        lane = state.lanes.setdefault(lane_id, deque())
        if lane_id not in state.rotation:
            state.rotation.append(lane_id)
        lane.append(request)
        state.wake.set()
        logger.debug("scheduled %s for lane %s on account %s", lane_id, lane_id, account_id)
        return await request.future

    async def _dispatch(self, account_id: str, state: AccountState) -> None:
        while True:
            request = await self._pick_ready(account_id, state)
            if request is None:
                return
            started = self._time()
            async with state.slot:
                try:
                    result = await request.call()
                except BaseException as exc:  # noqa: BLE001 - transport layer maps errors
                    result = exc
            await self._handle_result(account_id, state, request, result, started)

    async def _pick_ready(self, account_id: str, state: AccountState) -> LaneRequest | None:
        while True:
            if state.wake.is_set():
                state.wake.clear()
            now = self._time()
            if state.cooldown_until is not None:
                if now < state.cooldown_until:
                    await self._sleep_until(state, state.cooldown_until)
                    continue
                logger.info("account %s cooldown ended", account_id)
                state.cooldown_until = None

            request = self._next_ready(state, now)
            if request is not None:
                return request
            if not state.has_work():
                return None
            await self._sleep_until(state, self._nearest_not_before(state))

    async def _sleep_until(self, state: AccountState, target: float) -> None:
        delay = max(0.0, target - self._time())
        wake_task = asyncio.create_task(state.wake.wait())
        sleep_task = asyncio.create_task(self._sleep(delay))
        done, pending = await asyncio.wait(
            {wake_task, sleep_task}, return_when=asyncio.FIRST_COMPLETED
        )
        for task in pending:
            task.cancel()

    def _next_ready(self, state: AccountState, now: float) -> LaneRequest | None:
        total = len(state.rotation)
        for offset in range(total):
            idx = (state.rotation_pos + offset) % total
            lane_id = state.rotation[idx]
            lane = state.lanes.get(lane_id)
            if not lane:
                continue
            head = lane[0]
            if head.not_before <= now:
                state.rotation_pos = (idx + 1) % total
                lane.popleft()
                return head
        return None

    def _nearest_not_before(self, state: AccountState) -> float:
        return min(
            head.not_before
            for lane_id in state.rotation
            for head in state.lanes.get(lane_id, [])
        )

    async def _handle_result(
        self,
        account_id: str,
        state: AccountState,
        request: LaneRequest,
        result: object,
        started: float,
    ) -> None:
        wait_seconds = started - request.enqueued_at
        duration = self._time() - started
        method = getattr(request.call, "method", "") or "vk"
        if isinstance(result, BaseException):
            outcome = self._outcome(result)
            if self.metrics_hook:
                self.metrics_hook(account_id, method, outcome, wait_seconds, duration)
            if self._should_retry(request, result):
                await self._requeue(account_id, state, request, result)
                return
            category = self._policy.classify(result)
            if category is RetryCategory.NO_RETRY:
                request.future.set_exception(result)
            else:
                request.future.set_exception(
                    RetryExhaustedError(
                        getattr(result, "method", None) or "vk",
                        result,
                        request.attempts,
                        self._time() - request.enqueued_at,
                    )
                )
            return
        if self.metrics_hook:
            self.metrics_hook(account_id, method, OUTCOME_SUCCESS, wait_seconds, duration)
        request.future.set_result(result)

    def _should_retry(self, request: LaneRequest, error: BaseException) -> bool:
        category = self._policy.classify(error)
        if category is RetryCategory.NO_RETRY:
            return False
        if request.attempts >= self._policy.retry_budget(category):
            return False
        return self._time() < request.deadline

    async def _requeue(
        self,
        account_id: str,
        state: AccountState,
        request: LaneRequest,
        error: BaseException,
    ) -> None:
        category = self._policy.classify(error)
        delay = self._policy.delay_for(category, request.attempts)
        request.attempts += 1
        request.not_before = self._time() + delay

        cooldown = self._policy.account_cooldown(category)
        if cooldown is not None and state.cooldown_until is None:
            state.cooldown_until = self._time() + cooldown.total_seconds()
            logger.info("account %s enters cooldown for %ss", account_id, cooldown.total_seconds())

        logger.warning(
            "retry attempt %d for %s on account %s in %.1fs (category %s)",
            request.attempts, request.lane_id, account_id, delay, category.value,
        )
        if self.retry_hook:
            code = error.code if isinstance(error, VkApiRateLimitError) else 0
            self.retry_hook(account_id, code)

        state.lanes[request.lane_id].append(request)
        state.wake.set()

    def _outcome(self, error: BaseException) -> str:
        if isinstance(error, VkApiAuthError):
            return OUTCOME_AUTH
        if isinstance(error, VkApiRateLimitError):
            return OUTCOME_RATE_LIMIT
        if isinstance(error, (VkApiInfrastructureError, httpx.RequestError)):
            return OUTCOME_INFRA
        return OUTCOME_DOMAIN

    def queue_depth(self, account_id: str) -> int:
        state = self._accounts.get(account_id)
        if state is None:
            return 0
        return sum(len(lane) for lane in state.lanes.values())

    async def close(self) -> None:
        for state in self._accounts.values():
            if state.dispatcher is not None and not state.dispatcher.done():
                state.dispatcher.cancel()

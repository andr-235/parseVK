"""Fair per-account request scheduler with centralized retry and cooldown."""

import asyncio
import logging
import time
from collections import deque
from collections.abc import Awaitable, Callable

import httpx

from app.domain.exceptions.vk_api import (
    VkApiAuthError,
    VkApiInfrastructureError,
    VkApiRateLimitError,
)
from app.services.vk_retry_policy import RetryCategory, VkRetryPolicy
from app.services.vk_scheduler_models import AccountState, LaneRequest, RetryExhaustedError

logger = logging.getLogger(__name__)

MetricsHook = Callable[[str, str, str, float, float], None]
RetryHook = Callable[[str, int], None]
SleepFn = Callable[[float], Awaitable[object]]

OUTCOME_SUCCESS = "success"
OUTCOME_AUTH = "auth"
OUTCOME_RATE_LIMIT = "rate_limit"
OUTCOME_INFRA = "infra"
OUTCOME_DOMAIN = "domain"


class FairScheduler:
    """Round-robin lanes with one in-flight request and a per-account rate."""

    def __init__(
        self,
        retry_policy: VkRetryPolicy,
        *,
        time_fn: Callable[[], float] = time.monotonic,
        sleep_fn: SleepFn = asyncio.sleep,
    ):
        self._policy = retry_policy
        self._time = time_fn
        self._sleep = sleep_fn
        self._accounts: dict[str, AccountState] = {}
        self._create_lock = asyncio.Lock()
        self._closed = False
        self.metrics_hook: MetricsHook | None = None
        self.retry_hook: RetryHook | None = None

    async def execute(self, account_id: str, lane_id: str, call) -> object:
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
        async with self._create_lock:
            if self._closed:
                raise RuntimeError("VK scheduler is closed")
            state = self._accounts.setdefault(account_id, AccountState())
            self._enqueue(state, request)
            if state.dispatcher is None or state.dispatcher.done():
                state.dispatcher = asyncio.create_task(
                    self._dispatch(account_id, state)
                )
            state.wake.set()

        logger.debug("scheduled lane=%s on account=%s", lane_id, account_id)
        try:
            return await request.future
        except asyncio.CancelledError:
            if not request.future.done():
                request.future.cancel()
            state.wake.set()
            raise

    async def _dispatch(self, account_id: str, state: AccountState) -> None:
        current_task = asyncio.current_task()
        try:
            while True:
                request = await self._pick_ready(account_id, state)
                if request is None:
                    async with self._create_lock:
                        self._compact(state)
                        if state.has_work():
                            continue
                        if state.dispatcher is current_task:
                            state.dispatcher = None
                        return
                if request.future.cancelled():
                    continue

                await self._wait_for_rate_slot(state)
                if request.future.cancelled():
                    continue

                started = self._time()
                state.next_dispatch_at = (
                    started + self._policy.target_interval_seconds()
                )
                state.in_flight = request
                async with state.slot:
                    try:
                        result = await request.call()
                    except asyncio.CancelledError:
                        raise
                    except Exception as error:  # noqa: BLE001
                        result = error
                    finally:
                        state.in_flight = None
                await self._handle_result(
                    account_id, state, request, result, started
                )
        finally:
            async with self._create_lock:
                if state.dispatcher is current_task:
                    state.dispatcher = None

    async def _pick_ready(
        self, account_id: str, state: AccountState
    ) -> LaneRequest | None:
        while True:
            if state.wake.is_set():
                state.wake.clear()
            self._compact(state)
            now = self._time()
            if state.cooldown_until is not None:
                if now < state.cooldown_until:
                    await self._sleep_until(state, state.cooldown_until)
                    continue
                logger.info("account %s cooldown ended", account_id)
                state.cooldown_until = None

            request = self._next_ready(state, now)
            if request is not None:
                if now >= request.deadline:
                    self._set_retry_exhausted(request)
                    continue
                return request
            if not state.has_work():
                return None
            await self._sleep_until(state, self._nearest_not_before(state))

    async def _wait_for_rate_slot(self, state: AccountState) -> None:
        delay = max(0.0, state.next_dispatch_at - self._time())
        if delay > 0:
            await self._sleep(delay)

    async def _sleep_until(self, state: AccountState, target: float) -> None:
        delay = max(0.0, target - self._time())
        wake_task = asyncio.create_task(state.wake.wait())
        sleep_task = asyncio.create_task(self._sleep(delay))
        _, pending = await asyncio.wait(
            {wake_task, sleep_task}, return_when=asyncio.FIRST_COMPLETED
        )
        for task in pending:
            task.cancel()
        if pending:
            await asyncio.gather(*pending, return_exceptions=True)

    def _enqueue(self, state: AccountState, request: LaneRequest) -> None:
        lane = state.lanes.setdefault(request.lane_id, deque())
        if request.lane_id not in state.rotation:
            state.rotation.append(request.lane_id)
        lane.append(request)

    def _compact(self, state: AccountState) -> None:
        active_lanes: list[str] = []
        for lane_id in state.rotation:
            lane = state.lanes.get(lane_id)
            if lane is None:
                continue
            while lane and lane[0].future.cancelled():
                lane.popleft()
            if lane:
                active_lanes.append(lane_id)
            else:
                state.lanes.pop(lane_id, None)
        state.rotation = active_lanes
        if state.rotation:
            state.rotation_pos %= len(state.rotation)
        else:
            state.rotation_pos = 0

    def _next_ready(
        self, state: AccountState, now: float
    ) -> LaneRequest | None:
        total = len(state.rotation)
        for offset in range(total):
            idx = (state.rotation_pos + offset) % total
            lane_id = state.rotation[idx]
            lane = state.lanes[lane_id]
            head = lane[0]
            if head.not_before <= now:
                state.rotation_pos = (idx + 1) % total
                lane.popleft()
                return head
        return None

    def _nearest_not_before(self, state: AccountState) -> float:
        return min(
            state.lanes[lane_id][0].not_before
            for lane_id in state.rotation
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
                self.metrics_hook(
                    account_id, method, outcome, wait_seconds, duration
                )
            if request.future.cancelled():
                return
            if self._should_retry(request, result):
                self._requeue(account_id, state, request, result)
                return
            category = self._policy.classify(result)
            if category is RetryCategory.NO_RETRY:
                self._set_exception(request, result)
            else:
                self._set_retry_exhausted(request, result)
            return

        if self.metrics_hook:
            self.metrics_hook(
                account_id,
                method,
                OUTCOME_SUCCESS,
                wait_seconds,
                duration,
            )
        if not request.future.done():
            request.future.set_result(result)

    def _should_retry(
        self, request: LaneRequest, error: BaseException
    ) -> bool:
        category = self._policy.classify(error)
        if category is RetryCategory.NO_RETRY:
            return False
        if request.attempts >= self._policy.retry_budget(category):
            return False
        return self._time() < request.deadline

    def _requeue(
        self,
        account_id: str,
        state: AccountState,
        request: LaneRequest,
        error: BaseException,
    ) -> None:
        category = self._policy.classify(error)
        now = self._time()
        delay = self._policy.delay_for(category, request.attempts)
        request.attempts += 1
        request.last_error = error
        request.not_before = now + delay

        cooldown = self._policy.account_cooldown(category)
        if cooldown is not None:
            candidate = now + cooldown.total_seconds()
            state.cooldown_until = max(
                state.cooldown_until or candidate, candidate
            )
            logger.info(
                "account %s enters cooldown until %.3f",
                account_id,
                state.cooldown_until,
            )

        ready_at = max(
            request.not_before,
            state.cooldown_until or request.not_before,
        )
        if ready_at >= request.deadline:
            self._set_retry_exhausted(request, error)
            return

        logger.warning(
            "retry attempt %d for lane=%s account=%s in %.1fs (%s)",
            request.attempts,
            request.lane_id,
            account_id,
            delay,
            category.value,
        )
        if self.retry_hook:
            code = error.code if isinstance(error, VkApiRateLimitError) else 0
            self.retry_hook(account_id, code)

        self._enqueue(state, request)
        state.wake.set()

    def _set_retry_exhausted(
        self,
        request: LaneRequest,
        error: BaseException | None = None,
    ) -> None:
        last_error = error or request.last_error or TimeoutError(
            "scheduler deadline exceeded"
        )
        method = getattr(last_error, "method", None) or getattr(
            request.call, "method", None
        ) or "vk"
        self._set_exception(
            request,
            RetryExhaustedError(
                method,
                last_error,
                request.attempts,
                self._time() - request.enqueued_at,
            ),
        )

    @staticmethod
    def _set_exception(request: LaneRequest, error: BaseException) -> None:
        if not request.future.done():
            request.future.set_exception(error)

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
        return sum(
            1
            for lane in state.lanes.values()
            for request in lane
            if not request.future.cancelled()
        )

    async def close(self) -> None:
        async with self._create_lock:
            self._closed = True
            dispatchers = []
            for state in self._accounts.values():
                for lane in state.lanes.values():
                    for request in lane:
                        request.future.cancel()
                if state.in_flight is not None:
                    state.in_flight.future.cancel()
                if state.dispatcher is not None and not state.dispatcher.done():
                    state.dispatcher.cancel()
                    dispatchers.append(state.dispatcher)
        if dispatchers:
            await asyncio.gather(*dispatchers, return_exceptions=True)

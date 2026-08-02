"""VK retry policy: classification, budgets, delays and cooldowns."""

import random
from collections.abc import Callable
from datetime import timedelta
from enum import Enum

import httpx

from app.core.config import Settings
from app.domain.exceptions.vk_api import (
    VkApiAuthError,
    VkApiCaptchaError,
    VkApiInfrastructureError,
    VkApiRateLimitError,
)

CODE_SHORT_OVERSHOOT = 9
CODE_FLOOD = 6
CODE_HARD_LIMIT = 29

RateCategories = frozenset({CODE_SHORT_OVERSHOOT, CODE_FLOOD, CODE_HARD_LIMIT})

JitterFn = Callable[[float, float], float]


class RetryCategory(str, Enum):
    SHORT_OVERSHOOT = "short_overshoot"
    FLOOD = "flood"
    HARD_LIMIT = "hard_limit"
    TRANSIENT = "transient"
    NO_RETRY = "no_retry"


class VkRetryPolicy:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._random = random.Random()

    def classify(self, error: BaseException) -> RetryCategory:
        if isinstance(error, VkApiRateLimitError):
            if error.code == CODE_SHORT_OVERSHOOT:
                return RetryCategory.SHORT_OVERSHOOT
            if error.code == CODE_FLOOD:
                return RetryCategory.FLOOD
            if error.code == CODE_HARD_LIMIT:
                return RetryCategory.HARD_LIMIT
            return RetryCategory.NO_RETRY
        if isinstance(error, (VkApiInfrastructureError, httpx.RequestError)):
            return RetryCategory.TRANSIENT
        if isinstance(error, (VkApiAuthError, VkApiCaptchaError)):
            return RetryCategory.NO_RETRY
        return RetryCategory.NO_RETRY

    def retry_budget(self, category: RetryCategory) -> int:
        if category is RetryCategory.NO_RETRY:
            return 0
        return self._settings.rate_limit_max_retries

    def delay_for(
        self,
        category: RetryCategory,
        attempt: int,
        *,
        jitter: JitterFn | None = None,
    ) -> float:
        base = self._settings.short_backoff_base_seconds
        delay = base * (2**attempt)
        if category in (RetryCategory.SHORT_OVERSHOOT, RetryCategory.TRANSIENT):
            fn = jitter or self._random.uniform
            return delay * fn(0.5, 1.5)
        return delay

    def target_interval_seconds(self) -> float:
        return 1.0 / self._settings.target_requests_per_second

    def max_elapsed_seconds(self) -> float:
        return self._settings.retry_max_elapsed_seconds

    def account_cooldown(self, category: RetryCategory) -> timedelta | None:
        if category is RetryCategory.FLOOD:
            return timedelta(seconds=self._settings.account_cooldown_seconds)
        if category is RetryCategory.HARD_LIMIT:
            return timedelta(seconds=self._settings.hard_limit_cooldown_seconds)
        return None

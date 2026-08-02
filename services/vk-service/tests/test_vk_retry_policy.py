"""Unit tests for VkRetryPolicy classification, budgets, delays and cooldowns."""

import sys
from datetime import timedelta
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.config import Settings
from app.domain.exceptions.vk_api import (
    VK_API_AUTH_CODES,
    VK_API_CAPTCHA_CODE,
    VkApiAuthError,
    VkApiCaptchaError,
    VkApiInfrastructureError,
    VkApiRateLimitError,
)
from app.services.vk_retry_policy import RetryCategory, VkRetryPolicy


def _policy(**overrides) -> VkRetryPolicy:
    defaults = dict(
        vk_token="x",
        rate_limit_max_retries=5,
        retry_max_elapsed_seconds=300.0,
        short_backoff_base_seconds=1.0,
        account_cooldown_seconds=300,
        hard_limit_cooldown_seconds=3600,
    )
    defaults.update(overrides)
    return VkRetryPolicy(Settings(**defaults))


def _rate_limit_error(code: int) -> VkApiRateLimitError:
    return VkApiRateLimitError(code, "rate limited", "users.get")


def test_classify_rate_codes():
    policy = _policy()
    assert policy.classify(_rate_limit_error(9)) is RetryCategory.SHORT_OVERSHOOT
    assert policy.classify(_rate_limit_error(6)) is RetryCategory.FLOOD
    assert policy.classify(_rate_limit_error(29)) is RetryCategory.HARD_LIMIT


def test_classify_transient_and_no_retry():
    policy = _policy()
    assert policy.classify(VkApiInfrastructureError(10, "boom", "users.get")) is RetryCategory.TRANSIENT
    assert policy.classify(httpx.ConnectError("refused")) is RetryCategory.TRANSIENT

    for code in VK_API_AUTH_CODES:
        assert policy.classify(VkApiAuthError(code, "auth", "users.get")) is RetryCategory.NO_RETRY
    assert policy.classify(VkApiCaptchaError(VK_API_CAPTCHA_CODE, "captcha", "users.get")) is RetryCategory.NO_RETRY
    assert policy.classify(RuntimeError("unknown")) is RetryCategory.NO_RETRY


def test_retry_budget_bounds():
    policy = _policy(rate_limit_max_retries=5)
    assert policy.retry_budget(RetryCategory.SHORT_OVERSHOOT) == 5
    assert policy.retry_budget(RetryCategory.FLOOD) == 5
    assert policy.retry_budget(RetryCategory.HARD_LIMIT) == 5
    assert policy.retry_budget(RetryCategory.TRANSIENT) == 5
    assert policy.retry_budget(RetryCategory.NO_RETRY) == 0


def test_delay_determinism_with_seeded_jitter():
    policy = _policy()
    jitter = lambda a, b: 1.0  # noqa: E731
    assert policy.delay_for(RetryCategory.SHORT_OVERSHOOT, 0, jitter=jitter) == 1.0
    assert policy.delay_for(RetryCategory.SHORT_OVERSHOOT, 1, jitter=jitter) == 2.0
    assert policy.delay_for(RetryCategory.TRANSIENT, 2, jitter=jitter) == 4.0


def test_delay_no_jitter_for_flood_and_hard():
    policy = _policy()
    assert policy.delay_for(RetryCategory.FLOOD, 0) == 1.0
    assert policy.delay_for(RetryCategory.HARD_LIMIT, 1) == 2.0


def test_delay_uses_jitter_range():
    policy = _policy()
    jitter = lambda a, b: 1.5  # noqa: E731
    assert policy.delay_for(RetryCategory.SHORT_OVERSHOOT, 0, jitter=jitter) == 1.5


def test_max_elapsed_seconds():
    assert _policy().max_elapsed_seconds() == 300.0
    assert _policy(retry_max_elapsed_seconds=60.0).max_elapsed_seconds() == 60.0


def test_account_cooldowns():
    policy = _policy(account_cooldown_seconds=300, hard_limit_cooldown_seconds=3600)
    assert policy.account_cooldown(RetryCategory.FLOOD) == timedelta(seconds=300)
    assert policy.account_cooldown(RetryCategory.HARD_LIMIT) == timedelta(seconds=3600)
    assert policy.account_cooldown(RetryCategory.SHORT_OVERSHOOT) is None
    assert policy.account_cooldown(RetryCategory.TRANSIENT) is None
    assert policy.account_cooldown(RetryCategory.NO_RETRY) is None

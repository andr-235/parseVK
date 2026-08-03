"""Tests for the VK Prometheus metrics module and its scheduler wiring."""

import pytest
from prometheus_client import REGISTRY

from app.domain.exceptions.vk_api import VkApiAuthError, VkApiRateLimitError
from app.infrastructure.metrics import vk_metrics
from app.services.vk_retry_policy import VkRetryPolicy
from app.services.vk_scheduler import FairScheduler


def _sample(name: str, labels: dict) -> float | None:
    return REGISTRY.get_sample_value(name, labels)


@pytest.mark.anyio
async def test_observe_request_records_counter_and_duration():
    vk_metrics.observe_request("system-vk", "users.get", "success", 0.25)

    assert _sample(
        "vk_requests_total",
        {"account_id": "system-vk", "method": "users.get", "outcome": "success"},
    ) == 1.0
    assert _sample(
        "vk_request_duration_seconds_count",
        {"account_id": "system-vk", "method": "users.get"},
    ) == 1.0
    assert _sample(
        "vk_request_duration_seconds_sum",
        {"account_id": "system-vk", "method": "users.get"},
    ) == 0.25


@pytest.mark.anyio
async def test_observe_request_outcome_and_method_labels():
    vk_metrics.observe_request("acc-2", "wall.get", "auth", 0.1)
    vk_metrics.observe_request("acc-2", "wall.get", "rate_limit", 0.1)

    assert _sample(
        "vk_requests_total",
        {"account_id": "acc-2", "method": "wall.get", "outcome": "auth"},
    ) == 1.0
    assert _sample(
        "vk_requests_total",
        {"account_id": "acc-2", "method": "wall.get", "outcome": "rate_limit"},
    ) == 1.0


@pytest.mark.anyio
async def test_no_version_label_on_request_metrics():
    assert vk_metrics._requests_total._labelnames == (
        "account_id",
        "method",
        "outcome",
    )
    assert vk_metrics._request_duration_seconds._labelnames == (
        "account_id",
        "method",
    )


@pytest.mark.anyio
async def test_observe_rate_limit_retry_records_code_label():
    vk_metrics.observe_rate_limit_retry("system-vk", 6)
    vk_metrics.observe_rate_limit_retry("system-vk", 6)

    assert _sample(
        "vk_rate_limit_retries_total",
        {"account_id": "system-vk", "code": "6"},
    ) == 2.0


@pytest.mark.anyio
async def test_queue_depth_and_wait_metrics():
    vk_metrics.set_scheduler_queue_depth("system-vk", 3)
    vk_metrics.observe_scheduler_wait("system-vk", 0.5)

    assert _sample(
        "vk_scheduler_queue_depth", {"account_id": "system-vk"}
    ) == 3.0
    assert _sample(
        "vk_scheduler_wait_seconds_count", {"account_id": "system-vk"}
    ) == 1.0


@pytest.mark.anyio
async def test_account_status_gauge_flips_previous_status_to_zero():
    vk_metrics.set_account_status("system-vk", "active")
    vk_metrics.set_account_status("system-vk", "invalid")

    assert _sample(
        "vk_account_status",
        {"account_id": "system-vk", "status": "invalid"},
    ) == 1.0
    assert _sample(
        "vk_account_status",
        {"account_id": "system-vk", "status": "active"},
    ) == 0.0


@pytest.mark.anyio
async def test_account_cooldown_gauge_clamps_negative():
    vk_metrics.set_account_cooldown("system-vk", -5)
    vk_metrics.set_account_cooldown("acc-2", 42)

    assert _sample(
        "vk_account_cooldown_seconds", {"account_id": "system-vk"}
    ) == 0.0
    assert _sample(
        "vk_account_cooldown_seconds", {"account_id": "acc-2"}
    ) == 42.0


@pytest.mark.anyio
async def test_provider_account_info_carries_version():
    vk_metrics.set_provider_account_info("system-vk", "digest-abc")

    assert _sample(
        "vk_provider_account_info_info",
        {"account_id": "system-vk", "credential_version": "digest-abc"},
    ) == 1.0


@pytest.mark.anyio
async def test_scheduler_metrics_hook_reports_method_and_outcome():
    scheduler = FairScheduler(VkRetryPolicy(_settings()))
    calls = []
    scheduler.metrics_hook = lambda *args: calls.append(args)

    async def fail_auth():
        raise VkApiAuthError(5, "nope", "users.get")

    with pytest.raises(VkApiAuthError):
        await scheduler.execute("system-vk", "lane-1", fail_auth)

    account, method, outcome, _wait, _dur = calls[0]
    assert account == "system-vk"
    assert method == "vk"
    assert outcome == "auth"


@pytest.mark.anyio
async def test_scheduler_retry_hook_reports_code():
    scheduler = FairScheduler(VkRetryPolicy(_settings()))
    codes = []
    scheduler.retry_hook = lambda account, code: codes.append((account, code))

    async def rate_limited():
        raise VkApiRateLimitError(6, "too many", "wall.get")

    with pytest.raises(RuntimeError):
        await scheduler.execute("system-vk", "lane-1", rate_limited)

    assert codes and codes[0] == ("system-vk", 6)


class _Settings:
    target_requests_per_second = 100.0
    rate_limit_max_retries = 1
    retry_max_elapsed_seconds = 5.0
    short_backoff_base_seconds = 0.01
    account_cooldown_seconds = 0
    hard_limit_cooldown_seconds = 0


def _settings():
    return _Settings()

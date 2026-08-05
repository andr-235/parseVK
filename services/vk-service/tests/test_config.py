"""Tests for Settings configuration: secret sources and scheduler knobs."""

import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.config import Settings

SERVICE_DIR = str(Path(__file__).resolve().parents[1])


def test_token_file_satisfies_validation():
    settings = Settings(vk_token="", token_file="/run/secrets/vk_token")
    assert settings.token_file == "/run/secrets/vk_token"


def test_legacy_env_token_still_accepted():
    settings = Settings(vk_token="legacy-token", token_file="")
    assert settings.vk_token == "legacy-token"


def test_both_sources_accepted():
    settings = Settings(
        vk_token="legacy-token",
        token_file="/run/secrets/vk_token",
    )
    assert settings.token_file == "/run/secrets/vk_token"


def test_missing_secret_source_raises_outside_pytest():
    code = (
        "from app.core.config import Settings\n"
        "Settings(vk_token='', token_file='')\n"
    )
    result = subprocess.run(  # noqa: S603
        [sys.executable, "-c", code],
        cwd=SERVICE_DIR,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "VK_SERVICE_VK_TOKEN or VK_SERVICE_TOKEN_FILE" in result.stderr


def test_runtime_has_no_legacy_consumer_flags():
    settings = Settings(vk_token="x", token_file="")

    assert not hasattr(settings, "vk_commands_consumer_enabled")
    assert not hasattr(settings, "legacy_task_events_enabled")
    assert settings.kafka_consumer_enabled is True


def test_scheduler_knob_defaults():
    settings = Settings(vk_token="x", token_file="")
    assert settings.target_requests_per_second == 3.0
    assert settings.rate_limit_max_retries == 5
    assert settings.retry_max_elapsed_seconds == 300.0
    assert settings.short_backoff_base_seconds == 1.0
    assert settings.account_cooldown_seconds == 300
    assert settings.hard_limit_cooldown_seconds == 3600


def test_scheduler_knob_bounds_rejected():
    with pytest.raises(Exception):
        Settings(vk_token="x", target_requests_per_second=0)
    with pytest.raises(Exception):
        Settings(vk_token="x", retry_max_elapsed_seconds=0)

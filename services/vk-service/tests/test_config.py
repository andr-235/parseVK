"""Tests for Settings configuration: secret source validation and scheduler knobs."""

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
    """VK_SERVICE_TOKEN_FILE alone satisfies the secret requirement."""
    s = Settings(vk_token="", token_file="/run/secrets/vk_token")
    assert s.token_file == "/run/secrets/vk_token"


def test_legacy_env_token_still_accepted():
    """Legacy VK_SERVICE_VK_TOKEN remains a valid secret source."""
    s = Settings(vk_token="legacy-token", token_file="")
    assert s.vk_token == "legacy-token"


def test_both_sources_accepted():
    """File takes precedence but both being set is not a validation error."""
    s = Settings(vk_token="legacy-token", token_file="/run/secrets/vk_token")
    assert s.token_file == "/run/secrets/vk_token"


def test_missing_secret_source_raises_outside_pytest():
    """Neither file nor env token is a configuration error (outside pytest)."""
    code = (
        "from app.core.config import Settings\n"
        "Settings(vk_token='', token_file='')\n"
    )
    result = subprocess.run(
        [sys.executable, "-c", code],
        cwd=SERVICE_DIR,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert "VK_SERVICE_VK_TOKEN or VK_SERVICE_TOKEN_FILE" in result.stderr


def test_scheduler_knob_defaults():
    """Scheduler/retry settings carry sane defaults with bounds."""
    s = Settings(vk_token="x", token_file="")
    assert s.target_requests_per_second == 3.0
    assert s.rate_limit_max_retries == 5
    assert s.retry_max_elapsed_seconds == 300.0
    assert s.short_backoff_base_seconds == 1.0
    assert s.account_cooldown_seconds == 300
    assert s.hard_limit_cooldown_seconds == 3600


def test_scheduler_knob_bounds_rejected():
    """Non-positive scheduler knobs are rejected by pydantic fields."""
    with pytest.raises(Exception):
        Settings(vk_token="x", target_requests_per_second=0)
    with pytest.raises(Exception):
        Settings(vk_token="x", retry_max_elapsed_seconds=0)

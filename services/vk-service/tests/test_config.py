"""Tests for the single canonical VK runtime configuration."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.core.config import Settings

TOKEN_FILE = "/run/secrets/vk_token"


def test_token_file_is_the_only_vk_secret_source():
    settings = Settings(token_file=TOKEN_FILE)

    assert settings.token_file == TOKEN_FILE
    assert "vk_token" not in Settings.model_fields


def test_database_only_processes_do_not_require_vk_credentials():
    settings = Settings(token_file="")

    assert settings.token_file == ""


def test_only_one_canonical_command_consumer_switch_exists():
    settings = Settings(token_file=TOKEN_FILE)

    assert settings.kafka_consumer_enabled is False
    assert "vk_commands_consumer_enabled" not in Settings.model_fields
    assert "legacy_task_events_enabled" not in Settings.model_fields
    assert "vk_legacy_comment_events_enabled" not in Settings.model_fields
    assert "vk_batch_events_enabled" not in Settings.model_fields


def test_scheduler_knob_defaults():
    settings = Settings(token_file=TOKEN_FILE)

    assert settings.target_requests_per_second == 3.0
    assert settings.rate_limit_max_retries == 5
    assert settings.retry_max_elapsed_seconds == 300.0
    assert settings.short_backoff_base_seconds == 1.0
    assert settings.account_cooldown_seconds == 300
    assert settings.hard_limit_cooldown_seconds == 3600


def test_scheduler_knob_bounds_rejected():
    with pytest.raises(Exception):
        Settings(token_file=TOKEN_FILE, target_requests_per_second=0)
    with pytest.raises(Exception):
        Settings(token_file=TOKEN_FILE, retry_max_elapsed_seconds=0)


def test_lease_requires_three_heartbeat_intervals():
    with pytest.raises(Exception, match="three heartbeat intervals"):
        Settings(
            token_file=TOKEN_FILE,
            task_lease_seconds=30,
            task_heartbeat_seconds=20,
        )

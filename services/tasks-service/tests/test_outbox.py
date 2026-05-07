import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.outbox.publisher import kafka_key_for_event

SENSITIVE_KEYS = {"authorization", "cookie", "access_token", "refresh_token", "password"}


def assert_no_sensitive_payload(payload):
    lowered = {str(key).lower() for key in payload}
    assert lowered.isdisjoint(SENSITIVE_KEYS)


def test_task_event_type_has_no_version_suffix():
    assert "task.created".endswith(".v1") is False


def test_kafka_key_for_task_event_uses_task_id():
    assert kafka_key_for_event("task.created", {"taskId": "42", "ownerUserId": "u1"}, "42") == "42"


def test_kafka_key_for_automation_settings_event_uses_owner():
    assert (
        kafka_key_for_event(
            "task.automation_settings_updated",
            {"ownerUserId": "u1", "enabled": True},
            "u1",
        )
        == "u1"
    )


def test_payload_has_no_sensitive_keys():
    assert_no_sensitive_payload({"taskId": "42", "ownerUserId": "u1", "source": "manual"})

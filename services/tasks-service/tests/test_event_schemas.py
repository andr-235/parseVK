"""Tests for shared event schema integration."""

import sys
from pathlib import Path
from uuid import uuid4

import pytest
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

# Ensure shared `common` package is importable when running in isolation.
repo_root = Path(__file__).resolve().parents[4]
common_path = str(repo_root / "libs" / "py" / "common")
if common_path not in sys.path:
    sys.path.insert(0, common_path)

from common.events import TaskEventType, WireEvent


class TestWireEventSchema:
    """WireEvent from common.events matches tasks-service wire format."""

    def test_wire_event_validates_correctly(self):
        """WireEvent accepts all fields that tasks-service publishes."""
        event = WireEvent(
            event_id=uuid4(),
            event_type="task.created",
            event_version=1,
            aggregate_type="task",
            aggregate_id="123",
            correlation_id="corr-1",
            payload={"taskId": 1, "scope": "all"},
            created_at="2026-07-16T12:00:00+00:00",
        )
        assert event.event_type == "task.created"
        assert event.payload["taskId"] == 1

    def test_wire_event_ignores_extra_fields(self):
        """WireEvent has extra='ignore' — unknown fields are silently dropped."""
        event = WireEvent(
            event_id=uuid4(),
            event_type="task.created",
            event_version=1,
            aggregate_type="task",
            aggregate_id="123",
            correlation_id="corr-1",
            payload={},
            created_at="2026-07-16T12:00:00+00:00",
            unknown_field="should be ignored",
        )
        assert not hasattr(event, "unknown_field")

    def test_wire_event_rejects_missing_required_fields(self):
        """WireEvent raises ValidationError when required fields are missing."""
        with pytest.raises(ValidationError):
            WireEvent(
                event_id=uuid4(),
                event_type="task.created",
                # missing event_version, aggregate_type, aggregate_id, payload, created_at
            )

    def test_wire_event_serializes_to_json(self):
        """WireEvent.model_dump_json() produces valid JSON."""
        event = WireEvent(
            event_id=uuid4(),
            event_type="task.created",
            event_version=1,
            aggregate_type="task",
            aggregate_id="123",
            correlation_id="corr-1",
            payload={"key": "value"},
            created_at="2026-07-16T12:00:00+00:00",
        )
        json_str = event.model_dump_json()
        assert '"event_type"' in json_str
        assert '"task.created"' in json_str
        assert '"payload"' in json_str


class TestTaskEventTypeCompleteness:
    """TaskEventType includes all event types published by tasks-service."""

    def test_all_known_event_types_covered(self):
        """All event types used in tasks-service are in TaskEventType."""
        known_types = {
            "task.created",
            "task.resumed",
            "task.automation_run_requested",
            "task.automation_settings_updated",
            "task.deleted",
            "task.cancelled",
            "task.completed",
            "task.failed",
            "task.execution_started",
            "task.checked",
        }
        # TaskEventType is a Literal type — check that all known values are valid
        for event_type in known_types:
            assert event_type in TaskEventType.__args__, (
                f"{event_type} is missing from TaskEventType"
            )

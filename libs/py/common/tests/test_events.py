from uuid import UUID

import pytest
from pydantic import ValidationError

from common.events import EventEnvelope, ImEvent, TaskEvent, VkEvent


def test_event_envelope_has_uuid_and_payload():
    event = EventEnvelope(
        event_type="identity.user_created",
        producer="identity-service",
        payload={"user_id": "u1"},
    )

    assert event.event_version == 1
    assert event.payload == {"user_id": "u1"}
    assert str(event.event_id)


class TestTaskEvent:
    def test_valid_task_event(self):
        event = TaskEvent(
            event_id=UUID("00000000-0000-0000-0000-000000000001"),
            event_type="task.created",
            event_version=1,
            aggregate_id="task-123",
            payload={"scope": "test"},
        )
        assert event.event_type == "task.created"
        assert event.aggregate_id == "task-123"

    def test_validates_event_type(self):
        with pytest.raises(ValidationError):
            TaskEvent(
                event_id=UUID("00000000-0000-0000-0000-000000000001"),
                event_type="invalid.type",
                event_version=1,
                aggregate_id="task-123",
                payload={},
            )

    def test_serialization_roundtrip(self):
        event = TaskEvent(
            event_id=UUID("00000000-0000-0000-0000-000000000001"),
            event_type="task.created",
            event_version=1,
            aggregate_id="task-123",
            payload={"scope": "test"},
        )
        data = event.model_dump()
        restored = TaskEvent.model_validate(data)
        assert restored == event


class TestVkEvent:
    def test_valid_vk_event(self):
        event = VkEvent(
            event_id=UUID("00000000-0000-0000-0000-000000000001"),
            event_type="vk.post_collected",
            event_version=1,
            aggregate_id="post-456",
            payload={},
        )
        assert event.event_type == "vk.post_collected"

    def test_validates_event_type(self):
        with pytest.raises(ValidationError):
            VkEvent(
                event_id=UUID("00000000-0000-0000-0000-000000000001"),
                event_type="im.message_collected",
                event_version=1,
                aggregate_id="post-456",
                payload={},
            )


class TestImEvent:
    def test_valid_im_event(self):
        event = ImEvent(
            event_id=UUID("00000000-0000-0000-0000-000000000001"),
            event_type="im.message_collected",
            event_version=1,
            aggregate_id="msg-789",
            payload={},
        )
        assert event.event_type == "im.message_collected"

    def test_validates_event_type(self):
        with pytest.raises(ValidationError):
            ImEvent(
                event_id=UUID("00000000-0000-0000-0000-000000000001"),
                event_type="task.created",
                event_version=1,
                aggregate_id="msg-789",
                payload={},
            )

import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.events.models import (
    IM_EVENT_TYPES,
    UNKNOWN_EVENT_POLICY,
    VK_EVENT_TYPES,
    ImEvent,
    VkEvent,
)
from app.services.projections.im import ImProjectionService
from app.services.projections.vk import VkProjectionService


class EventRepository:
    def __init__(self):
        self.processed = set()
        self.calls = []

    async def is_processed(self, consumer_name, event_id):
        return (consumer_name, event_id) in self.processed

    async def mark_processed(self, consumer_name, event_id, event_type):
        self.processed.add((consumer_name, event_id))
        self.calls.append(("processed", event_type))

    async def upsert_message(self, messenger, message_id, chat_id):
        self.calls.append(("message", messenger, message_id, chat_id))

    async def delete_group(self, vk_group_id):
        self.calls.append(("group_deleted", vk_group_id))

def event(model, event_type, payload):
    return model.model_validate(
        {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "event_version": 1,
            "aggregate_id": "aggregate-1",
            "correlation_id": "corr-1",
            "payload": payload,
        }
    )


@pytest.mark.anyio
async def test_im_event_contract_is_idempotent():
    repository = EventRepository()
    service = ImProjectionService(repository)
    envelope = event(
        ImEvent,
        "im.message_collected",
        {"messenger": "whatsapp", "messageId": "m1", "chatId": "c1"},
    )

    assert await service.handle(envelope) is True
    assert await service.handle(envelope) is False
    assert repository.calls.count(("message", "whatsapp", "m1", "c1")) == 1


@pytest.mark.anyio
async def test_vk_group_deleted_contract_marks_event_processed():
    repository = EventRepository()
    service = VkProjectionService(repository)
    envelope = event(VkEvent, "vk.group_deleted", {"vkGroupId": 42})

    assert await service.handle(envelope) is True
    assert ("group_deleted", 42) in repository.calls
    assert ("processed", "vk.group_deleted") in repository.calls


def test_unknown_events_have_explicit_retry_policy():
    assert "vk.comment_collected" in VK_EVENT_TYPES
    assert "im.message_collected" in IM_EVENT_TYPES
    assert UNKNOWN_EVENT_POLICY == "retry"

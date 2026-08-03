"""Tests for the canonical VK execution command consumer."""

import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from common.events import WireEvent
from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

import app.tasks.vk_commands_consumer as consumer_module
from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer


class SessionContext:
    async def __aenter__(self):
        return SimpleNamespace()

    async def __aexit__(self, exc_type, exc, tb):
        return False


def session_factory():
    return SessionContext()


def command_payload(*, owner_user_id: str | None = "user-1"):
    source_id = uuid4()
    task_run_id = uuid4()
    execution_id = uuid4()
    command = VkExecutionRequested(
        task_id=10,
        task_run_id=task_run_id,
        execution_id=execution_id,
        owner_user_id=owner_user_id,
        demands=(
            VkSourceDemandRequest(
                demand_id=uuid4(),
                source=SourceReference(
                    source_id=source_id,
                    provider="vk",
                    source_type="community",
                    external_id="777",
                    owner_id=-777,
                ),
            ),
        ),
        post_selection=PostSelection(
            strategy="latestByPublishedAt",
            limit_per_source=15,
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=3,
        source_set_revision=4,
        snapshot_sha256="a" * 64,
    )
    wire = WireEvent(
        event_id=uuid4(),
        event_type="vk.execution.requested",
        event_version=1,
        aggregate_type="vk_execution",
        aggregate_id=str(execution_id),
        correlation_id=str(execution_id),
        payload=command.to_wire(),
        created_at="2026-08-04T00:00:00+00:00",
    )
    return command, wire


@pytest.mark.asyncio
async def test_valid_command_is_translated_after_contract_validation(monkeypatch):
    handler = SimpleNamespace(handle=AsyncMock())
    monkeypatch.setattr(
        consumer_module,
        "get_task_events_handler",
        lambda session: handler,
    )
    command, wire = command_payload()
    consumer = VkExecutionCommandsConsumer(
        session_factory=session_factory
    )

    await consumer.handle_message(wire.model_dump_json().encode())

    event = handler.handle.await_args.args[0]
    assert event.event_type == "task.created"
    assert event.payload["taskId"] == "10"
    assert event.payload["runId"] == str(command.task_run_id)
    assert event.payload["groupIds"] == [777]
    assert event.payload["postLimit"] == 15


@pytest.mark.asyncio
async def test_command_without_owner_is_rejected():
    _, wire = command_payload(owner_user_id=None)
    consumer = VkExecutionCommandsConsumer(
        session_factory=session_factory
    )

    with pytest.raises(ValueError, match="ownerUserId"):
        await consumer.handle_message(wire.model_dump_json().encode())


@pytest.mark.asyncio
async def test_command_with_wrong_correlation_is_rejected():
    _, wire = command_payload()
    payload = wire.model_dump()
    payload["correlation_id"] = str(uuid4())
    consumer = VkExecutionCommandsConsumer(
        session_factory=session_factory
    )

    with pytest.raises(ValueError, match="correlationId"):
        await consumer.handle_message(payload)

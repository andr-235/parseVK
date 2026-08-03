"""Tests for the canonical VK execution command consumer."""

import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from parsevk_contracts.validation import prepare_for_publish
from parsevk_contracts.vk.commands import (
    CATALOG as VK_COMMAND_CATALOG,
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)

import app.tasks.vk_commands_consumer as consumer_module
from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer


class SessionContext:
    async def __aenter__(self):
        return SimpleNamespace()

    async def __aexit__(self, exc_type, exc, tb):
        return False


def session_factory():
    return SessionContext()


def command_value(*, owner_user_id: str | None = "user-1"):
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
    prepared = prepare_for_publish(
        VK_COMMAND_CATALOG,
        message_type="vk.execution.requested",
        schema_version=1,
        producer="tasks-service",
        message_id=uuid4(),
        occurred_at=datetime.now(UTC),
        correlation_id=execution_id,
        causation_id=None,
        payload=command.model_dump(mode="python"),
    )
    return command, prepared.value


@pytest.mark.asyncio
async def test_valid_command_is_translated_after_contract_validation(monkeypatch):
    handler = SimpleNamespace(handle=AsyncMock())
    monkeypatch.setattr(
        consumer_module,
        "get_task_events_handler",
        lambda session: handler,
    )
    command, value = command_value()
    consumer = VkExecutionCommandsConsumer(
        session_factory=session_factory
    )

    await consumer.handle_message(value)

    event = handler.handle.await_args.args[0]
    assert event.event_type == "task.created"
    assert event.payload["taskId"] == "10"
    assert event.payload["runId"] == str(command.task_run_id)
    assert event.payload["groupIds"] == [777]
    assert event.payload["postLimit"] == 15


@pytest.mark.asyncio
async def test_command_without_owner_is_rejected():
    _, value = command_value(owner_user_id=None)
    consumer = VkExecutionCommandsConsumer(
        session_factory=session_factory
    )

    with pytest.raises(ValueError, match="ownerUserId"):
        await consumer.handle_message(value)


@pytest.mark.asyncio
async def test_command_with_wrong_correlation_is_rejected():
    _, value = command_value()
    payload = json.loads(value)
    payload["correlationId"] = str(uuid4())
    consumer = VkExecutionCommandsConsumer(
        session_factory=session_factory
    )

    with pytest.raises(Exception, match="correlationId"):
        await consumer.handle_message(payload)

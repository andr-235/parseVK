"""Tests for the canonical VK execution command consumer."""

import json
import sys
from contextlib import asynccontextmanager
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
from parsevk_contracts.vk.commands import CATALOG as VK_COMMAND_CATALOG
from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionCancelRequested,
    VkExecutionRequested,
    VkSourceDemandRequest,
)

import app.tasks.vk_commands_consumer as consumer_module
from app.tasks.vk_commands_consumer import VkExecutionCommandsConsumer


class FakeSession:
    @asynccontextmanager
    async def begin(self):
        yield self


class SessionContext:
    async def __aenter__(self):
        return FakeSession()

    async def __aexit__(self, exc_type, exc, tb):
        return False


def session_factory():
    return SessionContext()


def execution_value():
    source_id = uuid4()
    task_run_id = uuid4()
    execution_id = uuid4()
    command = VkExecutionRequested(
        task_id=10,
        task_run_id=task_run_id,
        execution_id=execution_id,
        owner_user_id="user-1",
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
        producer="tasks-service",
        message_id=uuid4(),
        occurred_at=datetime.now(UTC),
        correlation_id=execution_id,
        causation_id=None,
        payload=command.model_dump(mode="python"),
    )
    return command, prepared.value


def cancellation_value(command: VkExecutionRequested):
    cancellation = VkExecutionCancelRequested(
        task_id=command.task_id,
        task_run_id=command.task_run_id,
        execution_id=command.execution_id,
        owner_user_id=command.owner_user_id,
        reason="user_cancelled",
    )
    prepared = prepare_for_publish(
        VK_COMMAND_CATALOG,
        message_type="vk.execution.cancel_requested",
        producer="tasks-service",
        message_id=uuid4(),
        occurred_at=datetime.now(UTC),
        correlation_id=command.execution_id,
        causation_id=None,
        payload=cancellation.model_dump(mode="python"),
    )
    return cancellation, prepared.value


@pytest.mark.asyncio
async def test_valid_command_attaches_source_demands_directly(monkeypatch):
    inbox = SimpleNamespace(
        is_processed=AsyncMock(return_value=False),
        mark_processed=AsyncMock(),
    )
    attachment = SimpleNamespace(collection_created=True)
    repository = SimpleNamespace(
        attach_command=AsyncMock(
            return_value=SimpleNamespace(
                outcome="created",
                attachments=(attachment,),
                reason=None,
            )
        ),
        emit_rejection=AsyncMock(),
        request_cancellation=AsyncMock(),
    )
    monkeypatch.setattr(
        consumer_module,
        "SqlAlchemyTaskEventsRepository",
        lambda session: inbox,
    )
    monkeypatch.setattr(
        consumer_module,
        "CanonicalVkCommandRepository",
        lambda session: repository,
    )
    command, value = execution_value()

    await VkExecutionCommandsConsumer(session_factory=session_factory).handle_message(value)

    repository.attach_command.assert_awaited_once_with(command)
    repository.emit_rejection.assert_not_awaited()
    inbox.mark_processed.assert_awaited_once()


@pytest.mark.asyncio
async def test_cancellation_command_uses_canonical_repository(monkeypatch):
    inbox = SimpleNamespace(
        is_processed=AsyncMock(return_value=False),
        mark_processed=AsyncMock(),
    )
    repository = SimpleNamespace(
        attach_command=AsyncMock(),
        emit_rejection=AsyncMock(),
        request_cancellation=AsyncMock(return_value=SimpleNamespace()),
    )
    monkeypatch.setattr(
        consumer_module,
        "SqlAlchemyTaskEventsRepository",
        lambda session: inbox,
    )
    monkeypatch.setattr(
        consumer_module,
        "CanonicalVkCommandRepository",
        lambda session: repository,
    )
    command, _ = execution_value()
    cancellation, value = cancellation_value(command)

    await VkExecutionCommandsConsumer(session_factory=session_factory).handle_message(value)

    repository.request_cancellation.assert_awaited_once_with(cancellation)
    repository.attach_command.assert_not_awaited()
    inbox.mark_processed.assert_awaited_once()


@pytest.mark.asyncio
async def test_orphan_cancellation_is_retried_not_marked_processed(monkeypatch):
    inbox = SimpleNamespace(
        is_processed=AsyncMock(return_value=False),
        mark_processed=AsyncMock(),
    )
    repository = SimpleNamespace(
        attach_command=AsyncMock(),
        emit_rejection=AsyncMock(),
        request_cancellation=AsyncMock(return_value=None),
    )
    monkeypatch.setattr(
        consumer_module,
        "SqlAlchemyTaskEventsRepository",
        lambda session: inbox,
    )
    monkeypatch.setattr(
        consumer_module,
        "CanonicalVkCommandRepository",
        lambda session: repository,
    )
    command, _ = execution_value()
    _, value = cancellation_value(command)

    with pytest.raises(RuntimeError, match="no matching TaskRun binding"):
        await VkExecutionCommandsConsumer(session_factory=session_factory).handle_message(
            value
        )

    inbox.mark_processed.assert_not_awaited()


@pytest.mark.asyncio
async def test_duplicate_inbox_message_is_not_processed_again(monkeypatch):
    inbox = SimpleNamespace(
        is_processed=AsyncMock(return_value=True),
        mark_processed=AsyncMock(),
    )
    repository = SimpleNamespace(
        attach_command=AsyncMock(),
        emit_rejection=AsyncMock(),
        request_cancellation=AsyncMock(),
    )
    monkeypatch.setattr(
        consumer_module,
        "SqlAlchemyTaskEventsRepository",
        lambda session: inbox,
    )
    monkeypatch.setattr(
        consumer_module,
        "CanonicalVkCommandRepository",
        lambda session: repository,
    )
    _, value = execution_value()

    await VkExecutionCommandsConsumer(session_factory=session_factory).handle_message(value)

    repository.attach_command.assert_not_awaited()
    inbox.mark_processed.assert_not_awaited()


@pytest.mark.asyncio
async def test_command_without_owner_is_rejected():
    _, value = execution_value()
    payload = json.loads(value)
    del payload["payload"]["ownerUserId"]

    with pytest.raises(Exception, match="ownerUserId"):
        await VkExecutionCommandsConsumer(session_factory=session_factory).handle_message(
            json.dumps(payload).encode("utf-8")
        )


@pytest.mark.asyncio
async def test_command_with_wrong_correlation_is_rejected():
    _, value = execution_value()
    payload = json.loads(value)
    payload["correlationId"] = str(uuid4())

    with pytest.raises(Exception, match="correlationId"):
        await VkExecutionCommandsConsumer(session_factory=session_factory).handle_message(
            json.dumps(payload).encode("utf-8")
        )

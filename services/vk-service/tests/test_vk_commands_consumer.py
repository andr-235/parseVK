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


class TransactionContext:
    async def __aenter__(self):
        return None

    async def __aexit__(self, exc_type, exc, tb):
        return False


class FakeSession:
    def begin(self):
        return TransactionContext()


class SessionContext:
    def __init__(self, session):
        self.session = session

    async def __aenter__(self):
        return self.session

    async def __aexit__(self, exc_type, exc, tb):
        return False


def _factory(session):
    return lambda: SessionContext(session)


def _request_value():
    execution_id = uuid4()
    command = VkExecutionRequested(
        task_id=10,
        task_run_id=uuid4(),
        execution_id=execution_id,
        owner_user_id="user-1",
        demands=(
            VkSourceDemandRequest(
                demand_id=uuid4(),
                source=SourceReference(
                    source_id=uuid4(),
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
        schema_version=2,
        producer="tasks-service",
        message_id=uuid4(),
        occurred_at=datetime.now(UTC),
        correlation_id=execution_id,
        causation_id=None,
        payload=command.model_dump(mode="python"),
    )
    return command, prepared.value


def _cancel_value(command: VkExecutionRequested):
    cancel = VkExecutionCancelRequested(
        task_id=command.task_id,
        task_run_id=command.task_run_id,
        execution_id=command.execution_id,
        owner_user_id=command.owner_user_id,
        reason="user cancelled",
    )
    prepared = prepare_for_publish(
        VK_COMMAND_CATALOG,
        message_type="vk.execution.cancel_requested",
        schema_version=1,
        producer="tasks-service",
        message_id=uuid4(),
        occurred_at=datetime.now(UTC),
        correlation_id=command.execution_id,
        causation_id=None,
        payload=cancel.model_dump(mode="python"),
    )
    return cancel, prepared.value


def _install_repositories(monkeypatch, *, processed=False):
    inbox = SimpleNamespace(
        is_processed=AsyncMock(return_value=processed),
        mark_processed=AsyncMock(),
    )
    commands = SimpleNamespace(
        attach_command=AsyncMock(
            return_value=SimpleNamespace(
                outcome="created",
                attachments=(),
                reason=None,
            )
        ),
        emit_rejection=AsyncMock(),
    )
    cancellations = SimpleNamespace(request_cancellation=AsyncMock())
    monkeypatch.setattr(
        consumer_module,
        "SqlAlchemyTaskEventsRepository",
        lambda session: inbox,
    )
    monkeypatch.setattr(
        consumer_module,
        "CanonicalVkCommandRepository",
        lambda session: commands,
    )
    monkeypatch.setattr(
        consumer_module,
        "CanonicalCancellationRepository",
        lambda session: cancellations,
    )
    monkeypatch.setattr(
        consumer_module,
        "observe_collection_demand_attached",
        lambda **kwargs: None,
    )
    return inbox, commands, cancellations


@pytest.mark.asyncio
async def test_valid_request_is_attached_directly_after_contract_validation(
    monkeypatch,
):
    session = FakeSession()
    inbox, commands, _ = _install_repositories(monkeypatch)
    command, value = _request_value()
    consumer = VkExecutionCommandsConsumer(session_factory=_factory(session))

    await consumer.handle_message(value)

    commands.attach_command.assert_awaited_once()
    attached = commands.attach_command.await_args.args[0]
    assert attached == command
    inbox.mark_processed.assert_awaited_once()
    assert inbox.mark_processed.await_args.args[2] == "vk.execution.requested"


@pytest.mark.asyncio
async def test_valid_cancel_uses_exact_command_identity(monkeypatch):
    session = FakeSession()
    inbox, _, cancellations = _install_repositories(monkeypatch)
    request, _ = _request_value()
    cancel, value = _cancel_value(request)
    consumer = VkExecutionCommandsConsumer(session_factory=_factory(session))

    await consumer.handle_message(value)

    cancellations.request_cancellation.assert_awaited_once_with(
        task_id=cancel.task_id,
        run_id=str(cancel.task_run_id),
        execution_id=cancel.execution_id,
        owner_user_id=cancel.owner_user_id,
        reason=cancel.reason,
    )
    inbox.mark_processed.assert_awaited_once()
    assert inbox.mark_processed.await_args.args[2] == (
        "vk.execution.cancel_requested"
    )


@pytest.mark.asyncio
async def test_processed_message_is_idempotent(monkeypatch):
    session = FakeSession()
    inbox, commands, cancellations = _install_repositories(
        monkeypatch,
        processed=True,
    )
    _, value = _request_value()
    consumer = VkExecutionCommandsConsumer(session_factory=_factory(session))

    await consumer.handle_message(value)

    commands.attach_command.assert_not_awaited()
    cancellations.request_cancellation.assert_not_awaited()
    inbox.mark_processed.assert_not_awaited()


@pytest.mark.asyncio
async def test_command_without_owner_is_rejected(monkeypatch):
    session = FakeSession()
    _install_repositories(monkeypatch)
    _, value = _request_value()
    payload = json.loads(value)
    del payload["payload"]["ownerUserId"]
    consumer = VkExecutionCommandsConsumer(session_factory=_factory(session))

    with pytest.raises(Exception, match="ownerUserId"):
        await consumer.handle_message(json.dumps(payload).encode("utf-8"))


@pytest.mark.asyncio
async def test_command_with_wrong_correlation_is_rejected(monkeypatch):
    session = FakeSession()
    _install_repositories(monkeypatch)
    _, value = _request_value()
    payload = json.loads(value)
    payload["correlationId"] = str(uuid4())
    consumer = VkExecutionCommandsConsumer(session_factory=_factory(session))

    with pytest.raises(Exception, match="correlationId"):
        await consumer.handle_message(json.dumps(payload).encode("utf-8"))

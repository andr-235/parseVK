"""Tests for bootstrap.py dependency injection wiring.

Ensures that factory functions in bootstrap.py properly wire dependencies.
Catches missing-argument bugs that direct constructor calls in unit tests miss.
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.bootstrap import get_task_events_handler, get_vk_client
from app.infrastructure.tasks_client.client import TasksClient
from app.infrastructure.vk_client.client import VkApiClient


@pytest.mark.anyio
async def test_get_task_events_handler_wires_tasks_client():
    """Verify that get_task_events_handler injects a TasksClient instance.

    This guards against wiring bugs like the one in bootstrap.py:85 where
    tasks_client was omitted from the TaskEventsService constructor.
    """
    mock_session = AsyncMock()
    handler = get_task_events_handler(mock_session)

    assert handler is not None
    assert isinstance(handler.tasks_client, TasksClient)


def test_get_vk_client_returns_shared_facade():
    """The composition root returns the unbound shared VkApiClient singleton."""
    client = get_vk_client()

    assert isinstance(client, VkApiClient)
    assert get_vk_client() is client


@pytest.mark.anyio
async def test_get_ingestion_service_accepts_adapter_override():
    """The worker binds a per-task client and must win over the shared one."""
    from app.bootstrap import get_ingestion_service

    bound_adapter = AsyncMock()
    service = get_ingestion_service(AsyncMock(), adapter=bound_adapter)

    assert service.adapter is bound_adapter
    assert service.collector.adapter is bound_adapter

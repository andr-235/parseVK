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

from app.bootstrap import get_task_events_handler
from app.infrastructure.tasks_client.client import TasksClient


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

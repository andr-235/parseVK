import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.content.dependencies import get_content_service
from app.modules.content.service import ContentService
from app.modules.monitoring.dependencies import get_monitoring_service
from app.modules.monitoring.service import MonitoringService


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_get_content_service():
    mock_session = AsyncMock()
    service = await get_content_service(session=mock_session)
    assert isinstance(service, ContentService)


@pytest.mark.anyio
async def test_get_monitoring_service():
    mock_session = AsyncMock()
    service = await get_monitoring_service(session=mock_session)
    assert isinstance(service, MonitoringService)

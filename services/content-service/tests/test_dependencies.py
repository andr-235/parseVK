import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.content.dependencies import get_content_service
from app.modules.content.service import ContentService
from app.modules.listings.dependencies import get_listings_service
from app.modules.listings.service import ListingsService
from app.modules.monitoring.dependencies import get_monitoring_service
from app.modules.monitoring.service import MonitoringService
from app.modules.telegram_tgmbase.dependencies import get_tgmbase_service
from app.modules.telegram_tgmbase.service import TelegramTgmbaseService


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


@pytest.mark.anyio
async def test_get_listings_service():
    mock_session = AsyncMock()
    service = await get_listings_service(session=mock_session)
    assert isinstance(service, ListingsService)


@pytest.mark.anyio
async def test_get_tgmbase_service():
    mock_session = AsyncMock()
    service = await get_tgmbase_service(session=mock_session)
    assert isinstance(service, TelegramTgmbaseService)

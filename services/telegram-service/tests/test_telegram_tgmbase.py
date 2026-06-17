import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.telegram_tgmbase.parser import TelegramDlImportParseResult, TelegramDlImportRow
from app.modules.telegram_tgmbase.service import TelegramTgmbaseService


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def mock_parse_result():
    row = TelegramDlImportRow(
        source_row_index=2,
        telegram_id="123456",
        username="test_user",
        phone="79991234567",
        first_name="Ivan",
        last_name="Ivanov",
        description="Test description",
        region="Moscow",
        date="2026-05-01T12:00:00Z",
        channels="channel1",
        full_name="Ivan Ivanov",
        address="Moscow",
        vk_url="vk.com/ivan",
        email="ivan@test.com",
        telegram_contact="ivan_tg",
        instagram="ivan_inst",
        viber="ivan_viber",
        odnoklassniki="ivan_ok",
        birth_date="1990-01-01",
        username_extra="extra",
        geo="55.75,37.61"
    )
    return TelegramDlImportParseResult(
        original_file_name="test_contacts.xlsx",
        sheet_name="Sheet1",
        contacts=[row]
    )


@pytest.mark.asyncio
async def test_get_files_returns_empty_list():
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_session.execute = AsyncMock(return_value=mock_result)

    service = TelegramTgmbaseService(mock_session)
    files = await service.get_files()

    assert files == []


@pytest.mark.asyncio
async def test_get_contacts_returns_paginated_result():
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar.return_value = 0
    mock_result.scalars.return_value.all.return_value = []
    mock_session.execute = AsyncMock(return_value=mock_result)

    service = TelegramTgmbaseService(mock_session)
    res = await service.get_contacts(limit=10, offset=0)

    assert res["total"] == 0
    assert res["items"] == []
    assert res["limit"] == 10
    assert res["offset"] == 0


@pytest.mark.asyncio
async def test_upload_files_success(mock_parse_result):
    mock_session = AsyncMock()
    
    mock_batch = MagicMock()
    mock_batch.id = 1
    mock_batch.status = "RUNNING"
    mock_batch.files_total = 1
    mock_batch.files_success = 0
    mock_batch.files_failed = 0

    mock_file = MagicMock()
    mock_file.id = 10
    mock_file.batch_id = 1
    mock_file.original_file_name = "test_contacts.xlsx"
    mock_file.status = "DONE"
    mock_file.rows_total = 1
    mock_file.rows_success = 1
    mock_file.rows_failed = 0
    mock_file.is_active = True
    mock_file.replaced_file_id = None
    mock_file.error = None

    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    mock_session.execute = AsyncMock(return_value=mock_result)

    # Настраиваем асинхронный контекст менеджер для begin_nested
    mock_nested = MagicMock()
    mock_nested.__aenter__ = AsyncMock()
    mock_nested.__aexit__ = AsyncMock()
    mock_session.begin_nested.return_value = mock_nested

    service = TelegramTgmbaseService(mock_session)
    
    with patch.object(service.import_service.parser, "parse", return_value=mock_parse_result):
        def side_effect_refresh(obj):
            if isinstance(obj, MagicMock):
                return
            if obj.__class__.__name__ == "DlImportBatch":
                obj.id = 1
            elif obj.__class__.__name__ == "DlImportFile":
                obj.id = 10

        mock_session.refresh.side_effect = side_effect_refresh

        res = await service.upload_files([(b"dummy_content", "test_contacts.xlsx")])

        assert res["batch"]["id"] == "1"
        assert res["batch"]["status"] == "DONE"
        assert len(res["files"]) == 1
        assert res["files"][0]["originalFileName"] == "test_contacts.xlsx"
        assert res["files"][0]["status"] == "DONE"


def test_normalize_tgmbase_query():
    from app.modules.telegram_tgmbase.service import normalize_tgmbase_query

    # Telegram ID
    res = normalize_tgmbase_query("123456789")
    assert res["queryType"] == "telegramId"
    assert res["normalizedValue"] == "123456789"

    # Username
    res = normalize_tgmbase_query("@my_username")
    assert res["queryType"] == "username"
    assert res["normalizedValue"] == "my_username"

    # Phone number
    res = normalize_tgmbase_query("+7 999 123-45-67")
    assert res["queryType"] == "phoneNumber"
    assert res["normalizedValue"] == "+79991234567"

    # Invalid
    res = normalize_tgmbase_query("some random text")
    assert res["queryType"] == "invalid"


@pytest.mark.asyncio
async def test_search_tgmbase_returns_empty_when_no_match():
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_session.execute = AsyncMock(return_value=mock_result)

    service = TelegramTgmbaseService(mock_session)
    res = await service.search_tgmbase({
        "queries": ["123456"],
        "page": 1,
        "pageSize": 20
    })

    assert res["summary"]["total"] == 1
    assert res["summary"]["notFound"] == 1
    assert len(res["items"]) == 1
    assert res["items"][0]["status"] == "not_found"


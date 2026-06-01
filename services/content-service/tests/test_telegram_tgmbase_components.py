import io
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from openpyxl import load_workbook

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.telegram_tgmbase.exporter import TelegramDlMatchExporter  # noqa: E402
from app.modules.telegram_tgmbase.mapper import TelegramTgmbaseMapper  # noqa: E402
from app.modules.telegram_tgmbase.search import (  # noqa: E402
    TelegramTgmbaseSearchService,
    normalize_tgmbase_query,
)


def test_mapper_builds_search_profile_and_candidate():
    mapper = TelegramTgmbaseMapper()
    user = SimpleNamespace(
        id=1,
        user_id=123456,
        username="CaseUser",
        phone="+79991234567",
        first_name=" Case ",
        last_name=" User ",
        bot=False,
        scam=False,
        premium=True,
        upd_date=None,
    )

    profile = mapper.map_profile(user)
    candidate = mapper.map_candidate(user)

    assert profile["fullName"] == "Case User"
    assert profile["telegramId"] == "123456"
    assert profile["premium"] is True
    assert candidate == {
        "telegramId": "123456",
        "username": "CaseUser",
        "phoneNumber": "+79991234567",
        "fullName": "Case User",
    }


def test_search_component_keeps_query_and_summary_contracts():
    search = TelegramTgmbaseSearchService(session=SimpleNamespace(), mapper=TelegramTgmbaseMapper())

    assert normalize_tgmbase_query("@Mixed_User") == {
        "rawValue": "@Mixed_User",
        "normalizedValue": "mixed_user",
        "queryType": "username",
    }
    assert set(search._build_phone_variants("+7 999 123-45-67")) == {
        "+7 999 123-45-67",
        "+79991234567",
        "79991234567",
        "89991234567",
    }
    assert search._build_search_summary(
        [
            {"status": "found"},
            {"status": "not_found"},
            {"status": "ambiguous"},
            {"status": "invalid"},
            {"status": "error"},
        ]
    ) == {
        "total": 5,
        "found": 1,
        "notFound": 1,
        "ambiguous": 1,
        "invalid": 1,
        "error": 1,
    }


@pytest.mark.asyncio
async def test_exporter_writes_match_and_message_sheets():
    exporter = TelegramDlMatchExporter()
    content = await exporter.export_run(
        "7",
        [
            {
                "id": "11",
                "dlContactId": "22",
                "strictTelegramIdMatch": True,
                "usernameMatch": False,
                "phoneMatch": True,
                "dlContact": {
                    "telegramId": "123",
                    "username": "dl_user",
                    "phone": "+79990000000",
                },
                "tgmbaseUserId": "123",
                "tgmbaseUser": {
                    "userId": "123",
                    "username": "base_user",
                    "phone": "+79990000000",
                },
                "chats": [{"type": "group", "peer_id": "42", "title": "Cases"}],
            }
        ],
        {
            "11": [
                {
                    "peerId": "42",
                    "title": "Cases",
                    "messages": [{"id": "1", "date": "2026-05-31", "text": "hello"}],
                }
            ]
        },
    )

    workbook = load_workbook(io.BytesIO(content), data_only=True)

    assert workbook.sheetnames == ["matches", "messages"]
    assert workbook["matches"]["A2"].value == "7"
    assert workbook["matches"]["D2"].value == "telegram_id, phone"
    assert workbook["messages"]["F2"].value == "hello"
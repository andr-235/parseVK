import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.listings.service import ListingsService
from app.modules.listings.csv_export import format_csv_header, format_csv_row


class FakeRepository:
    def __init__(self):
        self.rows = {}
        self.next_id = 1

    async def find_by_url(self, url):
        return self.rows.get(url)

    async def create_listing(self, data):
        row = self.row({**data, "id": self.next_id})
        self.next_id += 1
        self.rows[row.url] = row
        return row

    async def update_by_url(self, url, data):
        current = self.rows[url]
        merged = current.__dict__ | data
        row = self.row(merged)
        self.rows[url] = row
        return row

    def row(self, data):
        defaults = {
            "id": data.get("id", 1),
            "source": None,
            "external_id": None,
            "title": None,
            "description": None,
            "url": data["url"],
            "price": None,
            "currency": None,
            "address": None,
            "city": None,
            "latitude": None,
            "longitude": None,
            "rooms": None,
            "area_total": None,
            "area_living": None,
            "area_kitchen": None,
            "floor": None,
            "floors_total": None,
            "published_at": None,
            "contact_name": None,
            "contact_phone": None,
            "images": [],
            "source_author_name": None,
            "source_author_phone": None,
            "source_author_url": None,
            "source_posted_at": None,
            "source_parsed_at": None,
            "manual_overrides": [],
            "manual_note": None,
            "archived": False,
            "created_at": datetime(2026, 5, 24, tzinfo=timezone.utc),
            "updated_at": datetime(2026, 5, 24, tzinfo=timezone.utc),
        }
        defaults.update(data)
        return SimpleNamespace(**defaults)


@pytest.mark.anyio
async def test_import_creates_updates_and_preserves_manual_overrides():
    repository = FakeRepository()
    service = ListingsService(repository)

    created = await service.import_listings(
        {
            "listings": [
                {
                    "url": "HTTPS://Example.test/flat?utm=1#frag",
                    "title": "Original",
                    "price": "100 руб.",
                    "author": "Seller",
                    "author_phone": "+7999",
                }
            ]
        }
    )

    assert created == {"processed": 1, "created": 1, "updated": 0, "skipped": 0, "failed": 0, "errors": []}
    row = repository.rows["https://example.test/flat"]
    row.manual_overrides = ["title"]

    updated = await service.import_listings(
        {
            "listings": [
                {
                    "url": "https://example.test/flat",
                    "title": "Imported",
                    "price": 250,
                    "contactName": "New Seller",
                }
            ],
            "updateExisting": True,
        }
    )

    assert updated["updated"] == 1
    assert repository.rows["https://example.test/flat"].title == "Original"
    assert repository.rows["https://example.test/flat"].price == 250
    assert repository.rows["https://example.test/flat"].contact_name == "New Seller"


@pytest.mark.anyio
async def test_import_partial_failures_and_duplicate_skip_when_update_disabled():
    repository = FakeRepository()
    service = ListingsService(repository)

    await service.import_listings({"listings": [{"url": "https://example.test/flat"}]})
    report = await service.import_listings(
        {
            "listings": [
                {"url": "https://example.test/flat"},
                {"url": "not-a-url"},
                {"url": "https://example.test/ok", "posted_at": "today"},
            ],
            "updateExisting": False,
        }
    )

    assert report["processed"] == 3
    assert report["created"] == 1
    assert report["skipped"] == 2
    assert report["failed"] == 1
    assert report["errors"][0]["index"] == 1


@pytest.mark.anyio
async def test_import_rejects_empty_payload_with_frontend_compatible_shape():
    service = ListingsService(FakeRepository())

    with pytest.raises(HTTPException) as exc_info:
        await service.import_listings({"listings": []})

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == {
        "message": "Неверный формат запроса импорта",
        "errors": ["listings не может быть пустым"],
    }


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("payload", "expected"),
    [
        ({"url": "https://example.test/flat", "images": "bad"}, "images должен быть массивом строк"),
        ({"url": "https://example.test/flat", "images": ["ok", 1]}, "каждый элемент images должен быть строкой"),
        ({"url": "https://example.test/flat", "publishedAt": "not-a-date"}, "publishedAt должен быть датой в формате ISO"),
        ({"url": "https://example.test/flat", "sourceParsedAt": "not-a-date"}, "sourceParsedAt должен быть датой в формате ISO"),
        ({"url": "https://example.test/flat", "title": 123}, "title должен быть строкой"),
        ({"url": "https://example.test/flat", "source": 123}, "source должен быть строкой"),
        ({"url": "https://example.test/flat", "price": {}}, "price должен быть строкой или числом"),
    ],
)
async def test_import_rejects_invalid_dto_field_types(payload, expected):
    service = ListingsService(FakeRepository())

    with pytest.raises(HTTPException) as exc_info:
        await service.import_listings({"listings": [payload]})

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["message"] == "Данные объявлений содержат ошибки"
    assert expected in exc_info.value.detail["errors"][0]


def test_csv_uses_standard_escaping_for_quotes_commas_newlines_and_semicolons():
    row = format_csv_row(
        {
            "id": 1,
            "title": 'A "quoted", multiline\nvalue',
            "images": ["one", "two"],
        },
        ["id", "title", "images"],
    )

    assert format_csv_header(["id", "title", "images"]) == "ID,Заголовок,Изображения"
    assert row == '1,"A ""quoted"", multiline\nvalue",one; two'

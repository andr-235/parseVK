import sys
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.listings.schemas import (
    ListingImportItem,
    ListingImportPayload,
    ListingResponse,
    ListingUpdateRequest,
    ListingsListResponse,
)


def test_listing_response_from_attributes():
    row = SimpleNamespace(
        id=1,
        source="avito",
        external_id="ext-1",
        title="Test",
        description=None,
        url="https://example.test/1",
        price=100,
        currency="RUB",
        address=None,
        city="Moscow",
        latitude=55.75,
        longitude=37.62,
        rooms=2,
        area_total=50.0,
        area_living=40.0,
        area_kitchen=10.0,
        floor=3,
        floors_total=10,
        published_at=datetime(2026, 1, 15, tzinfo=UTC),
        contact_name="John",
        contact_phone="+7999",
        images=["img1.jpg"],
        source_author_name=None,
        source_author_phone=None,
        source_author_url=None,
        source_posted_at="2026-01-14",
        source_parsed_at=datetime(2026, 1, 15, tzinfo=UTC),
        manual_overrides=["title"],
        manual_note=None,
        archived=False,
        created_at=datetime(2026, 1, 15, tzinfo=UTC),
        updated_at=datetime(2026, 1, 15, tzinfo=UTC),
    )
    result = ListingResponse.model_validate(row)
    assert result.id == 1
    assert result.url == "https://example.test/1"
    assert result.price == 100
    assert result.city == "Moscow"


def test_listing_update_request_partial():
    payload = ListingUpdateRequest(title="Updated", price=200)
    assert payload.title == "Updated"
    assert payload.price == 200
    assert payload.archived is None


def test_listing_update_request_accepts_camel_case_alias():
    payload = ListingUpdateRequest.model_validate({"contactName": "Alice", "manualNote": "note"})
    assert payload.contact_name == "Alice"
    assert payload.manual_note == "note"


def test_listing_import_item_valid():
    item = ListingImportItem(url="https://example.test/1", title="Test", price=100)
    assert item.url == "https://example.test/1"
    assert item.title == "Test"
    assert item.price == 100


def test_listing_import_item_missing_url():
    import pydantic

    try:
        ListingImportItem()
    except pydantic.ValidationError:
        pass
    else:
        assert False, "Expected ValidationError for missing url"


def test_listing_import_item_invalid_image_type():
    import pydantic

    try:
        ListingImportItem(url="https://test", images="not-a-list")
    except pydantic.ValidationError:
        pass
    else:
        assert False, "Expected ValidationError for invalid images type"


def test_listing_import_payload_valid():
    payload = ListingImportPayload(listings=[{"url": "https://example.test/1"}, {"url": "https://example.test/2"}])
    assert len(payload.listings) == 2


def test_listing_import_payload_empty_rejected():
    import pydantic

    try:
        ListingImportPayload(listings=[])
    except pydantic.ValidationError:
        pass
    else:
        assert False, "Expected ValidationError for empty listings"


def test_listings_list_response():
    from app.modules.listings.schemas import ListingResponse

    response = ListingsListResponse(
        items=[
            ListingResponse(
                id=1,
                url="https://test",
                images=[],
                manualOverrides=[],
            )
        ],
        total=1,
        page=1,
        pageSize=25,
        hasMore=False,
        sources=["avito"],
    )
    dumped = response.model_dump(by_alias=True)
    assert dumped["pageSize"] == 25
    assert dumped["hasMore"] is False
    assert dumped["items"][0]["images"] == []

from __future__ import annotations

from collections.abc import Callable, Coroutine

from app.modules.listings.helpers import (
    normalize_manual_overrides,
    normalize_url,
    string_value,
)
from app.modules.listings.import_builder import build_listing_data, sanitize_listing_item
from app.modules.listings.schemas import ListingImportPayload


class ListingsImportService:
    def __init__(
        self,
        find_by_url: Callable[[str], Coroutine],
        create_listing: Callable[[dict], Coroutine],
        update_by_url: Callable[[str, dict], Coroutine],
        exclude_manual_overrides_fn: Callable[[dict, list[str]], dict],
    ):
        self._find_by_url = find_by_url
        self._create_listing = create_listing
        self._update_by_url = update_by_url
        self._exclude_manual_overrides = exclude_manual_overrides_fn

    async def import_listings(self, payload: ListingImportPayload | dict) -> dict:
        if isinstance(payload, dict):
            payload = ListingImportPayload.model_validate(payload)
        errors = []
        created = updated = skipped = 0

        for index, item in enumerate(payload.listings):
            try:
                raw = item.model_dump(exclude_unset=True, by_alias=False)
                sanitized = sanitize_listing_item(raw)
                raw_url = string_value(sanitized.get("url"))
                if not raw_url:
                    raise ValueError("url обязателен")
                url = normalize_url(raw_url)
                data = build_listing_data({**sanitized, "url": url})
                existing = await self._find_by_url(url)
                if existing is not None:
                    if payload.updateExisting is False:
                        skipped += 1
                        continue
                    update_data = self._exclude_manual_overrides(
                        data, normalize_manual_overrides(existing.manual_overrides)
                    )
                    await self._update_by_url(url, update_data)
                    updated += 1
                else:
                    await self._create_listing(data)
                    created += 1
            except Exception as exc:
                skipped += 1
                errors.append({
                    "index": index,
                    "url": (
                        raw.get("url")
                        if isinstance(raw, dict) and isinstance(raw.get("url"), str)
                        else None
                    ),
                    "message": str(exc) or "Неизвестная ошибка базы данных",
                })

        return {
            "processed": len(payload.listings),
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "failed": len(errors),
            "errors": errors,
        }

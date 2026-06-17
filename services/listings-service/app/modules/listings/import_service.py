from __future__ import annotations

from collections.abc import Callable, Coroutine
from typing import Any

from app.modules.listings.helpers import (
    normalize_manual_overrides,
    normalize_url,
    raise_validation,
    string_value,
)
from app.modules.listings.import_builder import build_listing_data, sanitize_listing_item
from app.modules.listings.import_validator import validate_import_items


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

    async def import_listings(self, payload: Any) -> dict:
        request = self.normalize_import_payload(payload)
        validate_import_items(request["listings"])
        errors = []
        created = updated = skipped = 0

        for index, item in enumerate(request["listings"]):
            try:
                sanitized = sanitize_listing_item(item)
                raw_url = string_value(sanitized.get("url"))
                if not raw_url:
                    raise ValueError("url \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d")
                url = normalize_url(raw_url)
                data = build_listing_data({**sanitized, "url": url})
                existing = await self._find_by_url(url)
                if existing is not None:
                    if request.get("updateExisting") is False:
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
                        item.get("url")
                        if isinstance(item, dict) and isinstance(item.get("url"), str)
                        else None
                    ),
                    "message": str(exc) or "\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u0430\u044f \u043e\u0448\u0438\u0431\u043a\u0430 \u0431\u0430\u0437\u044b \u0434\u0430\u043d\u043d\u044b\u0445",
                })

        return {
            "processed": len(request["listings"]),
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "failed": len(errors),
            "errors": errors,
        }

    def normalize_import_payload(self, payload: Any) -> dict:
        if isinstance(payload, list):
            payload = {"listings": payload}
        elif isinstance(payload, dict) and "listings" not in payload:
            payload = {"listings": [payload]}
        if not isinstance(payload, dict) or not isinstance(payload.get("listings"), list):
            raise_validation(
                "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u0438\u043c\u043f\u043e\u0440\u0442\u0430",
                ["\u041e\u0436\u0438\u0434\u0430\u043b\u0441\u044f \u043c\u0430\u0441\u0441\u0438\u0432 \u043e\u0431\u044a\u044f\u0432\u043b\u0435\u043d\u0438\u0439 \u0438\u043b\u0438 \u043e\u0431\u044a\u0435\u043a\u0442 \u0441 \u043f\u043e\u043b\u0435\u043c listings"],
            )
        if len(payload["listings"]) == 0:
            raise_validation(
                "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u0438\u043c\u043f\u043e\u0440\u0442\u0430",
                ["listings \u043d\u0435 \u043c\u043e\u0436\u0435\u0442 \u0431\u044b\u0442\u044c \u043f\u0443\u0441\u0442\u044b\u043c"],
            )
        if "updateExisting" in payload and not isinstance(payload["updateExisting"], bool):
            raise_validation(
                "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0437\u0430\u043f\u0440\u043e\u0441\u0430 \u0438\u043c\u043f\u043e\u0440\u0442\u0430",
                ["updateExisting \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a\u0438\u043c \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435\u043c"],
            )
        return payload

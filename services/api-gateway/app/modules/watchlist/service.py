import httpx
from fastapi import HTTPException

from app.core.config import settings


class WatchlistGatewayService:
    def __init__(self):
        self.moderation_url = settings.moderation_base_url
        self.content_url = settings.content_base_url
        self.headers = {"X-Internal-Service-Token": settings.internal_service_token}

    async def get_authors(self, offset: int, limit: int, exclude_stopped: bool) -> dict:
        params = {
            "offset": offset,
            "limit": limit,
            "excludeStopped": exclude_stopped,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.moderation_url}/internal/watchlist/authors",
                params=params,
                headers=self.headers,
            )
            resp.raise_for_status()
            data = resp.json()

        items = await self._enrich_authors(data["items"])
        return {
            "items": items,
            "total": data["total"],
            "hasMore": data["hasMore"],
        }

    async def get_author_details(self, id: int, offset: int, limit: int) -> dict:
        params = {"offset": offset, "limit": limit}
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.moderation_url}/internal/watchlist/authors/{id}",
                params=params,
                headers=self.headers,
            )
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Watchlist author not found")
            resp.raise_for_status()
            data = resp.json()

        enriched_list = await self._enrich_authors([data])
        enriched_author = enriched_list[0] if enriched_list else data

        return {
            **enriched_author,
            "comments": data["comments"],
        }

    async def create_author(self, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.moderation_url}/internal/watchlist/authors",
                json=payload,
                headers=self.headers,
            )
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Source comment not found")
            if resp.status_code == 409:
                raise HTTPException(status_code=409, detail="Author already in watchlist")
            resp.raise_for_status()
            data = resp.json()

        enriched = await self._enrich_authors([data])
        return enriched[0] if enriched else data

    async def update_author(self, id: int, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{self.moderation_url}/internal/watchlist/authors/{id}",
                json=payload,
                headers=self.headers,
            )
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail="Watchlist author not found")
            resp.raise_for_status()
            data = resp.json()

        enriched = await self._enrich_authors([data])
        return enriched[0] if enriched else data

    async def get_settings(self) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.moderation_url}/internal/watchlist/settings",
                headers=self.headers,
            )
            resp.raise_for_status()
            data = resp.json()

        # Map settings to camelCase
        return {
            "id": data["id"],
            "trackAllComments": data["track_all_comments"],
            "pollIntervalMinutes": data["poll_interval_minutes"],
            "maxAuthors": data["max_authors"],
        }

    async def update_settings(self, payload: dict) -> dict:
        # Adapt frontend camelCase to backend snake_case
        backend_payload = {}
        if "trackAllComments" in payload:
            backend_payload["track_all_comments"] = payload["track_all_comments"]
        if "pollIntervalMinutes" in payload:
            backend_payload["poll_interval_minutes"] = payload["poll_interval_minutes"]
        if "maxAuthors" in payload:
            backend_payload["max_authors"] = payload["max_authors"]

        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{self.moderation_url}/internal/watchlist/settings",
                json=backend_payload,
                headers=self.headers,
            )
            resp.raise_for_status()
            data = resp.json()

        return {
            "id": data["id"],
            "trackAllComments": data["track_all_comments"],
            "pollIntervalMinutes": data["poll_interval_minutes"],
            "maxAuthors": data["max_authors"],
        }

    async def manual_refresh(self) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.moderation_url}/internal/watchlist/refresh",
                headers=self.headers,
            )
            resp.raise_for_status()
            return resp.json()

    # ------------------------------------------------------------------ #
    #  Private helpers                                                     #
    # ------------------------------------------------------------------ #

    async def _enrich_authors(self, records: list[dict]) -> list[dict]:
        if not records:
            return []

        author_vk_ids = list({r["author_vk_id"] for r in records if r.get("author_vk_id")})
        authors_dict = {}

        if author_vk_ids:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"{self.content_url}/internal/content/authors/bulk",
                        json=author_vk_ids,
                        headers=self.headers,
                    )
                    if resp.status_code == 200:
                        authors_dict = {a["vkAuthorId"]: a for a in resp.json() if "vkAuthorId" in a}
            except Exception:
                # Fallback if content-service is down
                pass

        enriched_items = []
        for r in records:
            vk_id = r.get("author_vk_id")
            author_profile = authors_dict.get(vk_id) if vk_id else None

            # Generate fallback summary if profile summary is missing
            summary = None
            if author_profile and "summary" in author_profile:
                summary = author_profile["summary"]
            else:
                summary = {
                    "total": 0,
                    "suspicious": 0,
                    "lastAnalyzedAt": None,
                    "categories": [],
                    "levels": [],
                }

            # Map to frontend model (WatchlistAuthorCardDto)
            enriched = {
                "id": r["id"],
                "authorVkId": vk_id,
                "status": r["status"],
                "lastCheckedAt": r.get("last_checked_at"),
                "lastActivityAt": r.get("last_activity_at"),
                "foundCommentsCount": r.get("found_comments_count", 0),
                "monitoringStartedAt": r["monitoring_started_at"],
                "monitoringStoppedAt": r.get("monitoring_stopped_at"),
                "author": author_profile,
                "summary": summary,
            }
            enriched_items.append(enriched)

        return enriched_items


def get_watchlist_gateway_service() -> WatchlistGatewayService:
    return WatchlistGatewayService()

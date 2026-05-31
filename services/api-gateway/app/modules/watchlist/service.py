from typing import Any

from app.clients.content.client import (
    ContentClient,
    ContentClientHTTPError,
    ContentClientUnavailableError,
)
from app.clients.moderation.client import (
    ModerationClient,
    ModerationClientHTTPError,
    ModerationClientUnavailableError,
)
from fastapi import HTTPException, status


class WatchlistGatewayService:
    def __init__(
        self,
        moderation_client: ModerationClient | None = None,
        content_client: ContentClient | None = None,
    ):
        self.moderation_client = moderation_client or ModerationClient()
        self.content_client = content_client or ContentClient()
        self.moderation_url = self.moderation_client.base_url
        self.content_url = self.content_client.base_url

    async def get_authors(
        self,
        offset: int,
        limit: int,
        exclude_stopped: bool,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        params = {
            "offset": offset,
            "limit": limit,
            "excludeStopped": exclude_stopped,
        }
        data = await self._moderation_request(
            "GET",
            "/internal/watchlist/authors",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
        )

        items = await self._enrich_authors(
            data["items"],
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return {
            "items": items,
            "total": data["total"],
            "hasMore": data["hasMore"],
        }

    async def get_author_details(
        self,
        id: int,
        offset: int,
        limit: int,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        params = {"offset": offset, "limit": limit}
        data = await self._moderation_request(
            "GET",
            f"/internal/watchlist/authors/{id}",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            params=params,
            status_details={404: "Watchlist author not found"},
        )

        enriched_list = await self._enrich_authors(
            [data],
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        enriched_author = enriched_list[0] if enriched_list else data

        return {
            **enriched_author,
            "comments": data["comments"],
        }

    async def create_author(
        self,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        backend_payload = {}
        if "authorVkId" in payload:
            backend_payload["author_vk_id"] = payload["authorVkId"]
        if "commentId" in payload:
            backend_payload["comment_id"] = payload["commentId"]

        data = await self._moderation_request(
            "POST",
            "/internal/watchlist/authors",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json=backend_payload,
            status_details={
                404: "Source comment not found",
                409: "Author already in watchlist",
            },
        )

        enriched = await self._enrich_authors(
            [data],
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return enriched[0] if enriched else data

    async def update_author(
        self,
        id: int,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        data = await self._moderation_request(
            "PATCH",
            f"/internal/watchlist/authors/{id}",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json=payload,
            status_details={404: "Watchlist author not found"},
        )

        enriched = await self._enrich_authors(
            [data],
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return enriched[0] if enriched else data

    async def get_settings(
        self,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        data = await self._moderation_request(
            "GET",
            "/internal/watchlist/settings",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )

        # Map settings to camelCase
        return {
            "id": data["id"],
            "trackAllComments": data["track_all_comments"],
            "pollIntervalMinutes": data["poll_interval_minutes"],
            "maxAuthors": data["max_authors"],
        }

    async def update_settings(
        self,
        payload: dict,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        # Adapt frontend camelCase to backend snake_case
        backend_payload = {}
        if "trackAllComments" in payload:
            backend_payload["track_all_comments"] = payload["trackAllComments"]
        if "pollIntervalMinutes" in payload:
            backend_payload["poll_interval_minutes"] = payload["pollIntervalMinutes"]
        if "maxAuthors" in payload:
            backend_payload["max_authors"] = payload["maxAuthors"]

        data = await self._moderation_request(
            "PATCH",
            "/internal/watchlist/settings",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
            json=backend_payload,
        )

        return {
            "id": data["id"],
            "trackAllComments": data["track_all_comments"],
            "pollIntervalMinutes": data["poll_interval_minutes"],
            "maxAuthors": data["max_authors"],
        }

    async def manual_refresh(
        self,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> dict:
        return await self._moderation_request(
            "POST",
            "/internal/watchlist/refresh",
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )

    # ------------------------------------------------------------------ #
    #  Private helpers                                                     #
    # ------------------------------------------------------------------ #

    async def _moderation_request(
        self,
        method: str,
        path: str,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
        params: dict | None = None,
        json: Any | None = None,
        status_details: dict[int, str] | None = None,
    ) -> dict:
        try:
            return await self.moderation_client.request(
                method,
                path,
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
                json=json,
            )
        except ModerationClientHTTPError as exc:
            detail = (status_details or {}).get(exc.status_code, exc.detail)
            raise HTTPException(status_code=exc.status_code, detail=detail) from exc
        except ModerationClientUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Moderation service unavailable",
            ) from exc

    async def _enrich_authors(
        self,
        records: list[dict],
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> list[dict]:
        if not records:
            return []

        author_vk_ids = list({r["author_vk_id"] for r in records if r.get("author_vk_id")})
        authors_dict = {}

        if author_vk_ids:
            try:
                authors = await self.content_client.request(
                    "POST",
                    "/internal/content/authors/bulk",
                    user_id=user_id,
                    request_id=request_id,
                    correlation_id=correlation_id,
                    json=author_vk_ids,
                )
                authors_dict = {a["vkAuthorId"]: a for a in authors if "vkAuthorId" in a}
            except (ContentClientHTTPError, ContentClientUnavailableError):
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

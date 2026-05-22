import httpx
from fastapi import Request

from app.core.config import settings


class CommentsGatewayService:
    def __init__(self):
        self.moderation_url = settings.moderation_base_url
        self.content_url = settings.content_base_url
        self.headers = {"X-Internal-Service-Token": settings.internal_service_token}

    async def get_comments(self, params: dict):
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.moderation_url}/internal/moderation/comments",
                params=params,
                headers=self.headers,
            )
            resp.raise_for_status()
            items = resp.json()
            return await self._enrich_comments(client, items)

    async def get_comments_cursor(self, params: dict):
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.moderation_url}/internal/moderation/comments/cursor",
                params=params,
                headers=self.headers,
            )
            resp.raise_for_status()
            data = resp.json()
            data["items"] = await self._enrich_comments(client, data["items"])
            return data

    async def patch_read_status(self, id: int, payload: dict):
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{self.moderation_url}/internal/moderation/comments/{id}/read",
                json=payload,
                headers=self.headers,
            )
            resp.raise_for_status()
            item = resp.json()
            enriched = await self._enrich_comments(client, [item])
            return enriched[0] if enriched else item

    async def _enrich_comments(self, client: httpx.AsyncClient, items: list[dict]):
        if not items:
            return items

        author_vk_ids = list({item["author_vk_id"] for item in items if item.get("author_vk_id")})
        post_external_keys = list({item["post_external_key"] for item in items if item.get("post_external_key")})

        authors_dict = {}
        if author_vk_ids:
            author_resp = await client.post(
                f"{self.content_url}/internal/content/authors/bulk",
                json=author_vk_ids,
                headers=self.headers,
            )
            if author_resp.status_code == 200:
                authors = author_resp.json()
                authors_dict = {a["vkAuthorId"]: a for a in authors}

        posts_dict = {}
        if post_external_keys:
            post_resp = await client.post(
                f"{self.content_url}/internal/content/posts/bulk",
                json=post_external_keys,
                headers=self.headers,
            )
            if post_resp.status_code == 200:
                posts = post_resp.json()
                posts_dict = {p["externalKey"]: p for p in posts}

        enriched_items = []
        for item in items:
            author_vk_id = item.get("author_vk_id")
            post_key = item.get("post_external_key")
            
            author = authors_dict.get(author_vk_id) if author_vk_id else None
            post = posts_dict.get(post_key) if post_key else None
            
            parts = item["external_key"].split(":")
            owner_id = int(parts[0]) if len(parts) > 0 else None
            post_id = int(parts[1]) if len(parts) > 1 else None
            comment_id = int(parts[2]) if len(parts) > 2 else None
            
            enriched = {
                "id": item["id"],
                "ownerId": owner_id,
                "postId": post_id,
                "vkCommentId": comment_id,
                "text": item.get("text"),
                "postText": post.get("text") if post else None,
                "createdAt": item.get("date"),
                "isRead": item.get("is_read"),
                "authorVkId": author_vk_id,
                "fromId": author_vk_id,
                "author": author,
                # To match keywords we would fetch keywords, but for now just pass empty or string matches
                "matchedKeywords": [{"id": 0, "word": w, "category": "auto"} for w in item.get("matched_keywords", [])],
                "externalKey": item["external_key"]
            }
            enriched_items.append(enriched)

        return enriched_items


def get_comments_gateway_service() -> CommentsGatewayService:
    return CommentsGatewayService()

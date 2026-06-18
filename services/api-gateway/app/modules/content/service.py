import logging

from app.clients.base import ServiceClient
from app.clients.vk_service.client import VkServiceClient

logger = logging.getLogger(__name__)
from app.core.config import settings
from app.core.utils import request_ids
from app.modules._base import BaseGatewayService
from app.modules.auth.service import GatewayAuthService
from fastapi import Request


class ContentGatewayService(BaseGatewayService):
    def __init__(self, client: ServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(
            client or ServiceClient(service_name="Content", base_url=settings.content_base_url, internal_token=settings.internal_service_token),
            auth_service,
        )

    async def merge_groups(self, request: Request, vk_groups: list[dict]) -> dict:
        request_id, correlation_id = request_ids(request)
        vk_ids = [group["id"] for group in vk_groups]
        try:
            existing = await self.client.request("POST", "/internal/content/groups/bulk", json=vk_ids, request_id=request_id, correlation_id=correlation_id)
        except Exception as exc:
            logger.warning("Failed to fetch existing groups from content service: %s", exc)
            existing = []

        existing_ids = {group["vkId"] for group in existing}
        items = []
        for g in vk_groups:
            g_id = g.get("id")
            exists = g_id in existing_ids
            items.append({
                "id": g_id, "vkId": g_id, "vkGroupId": g_id,
                "name": g.get("name"), "screenName": g.get("screen_name"), "screen_name": g.get("screen_name"),
                "isClosed": g.get("is_closed"), "is_closed": g.get("is_closed"),
                "deactivated": g.get("deactivated"), "type": g.get("type"),
                "photo50": g.get("photo_50"), "photo_50": g.get("photo_50"),
                "photo100": g.get("photo_100"), "photo_100": g.get("photo_100"),
                "photo200": g.get("photo_200"), "photo_200": g.get("photo_200"),
                "activity": g.get("activity"), "ageLimits": g.get("age_limits"), "age_limits": g.get("age_limits"),
                "description": g.get("description"), "membersCount": g.get("members_count"), "members_count": g.get("members_count"),
                "status": g.get("status"), "verified": g.get("verified"),
                "wall": g.get("wall"), "addresses": g.get("addresses"),
                "city": g.get("city"), "counters": g.get("counters"),
                "existsInDb": exists,
            })

        exists_in_db = [item for item in items if item["existsInDb"]]
        missing = [item for item in items if not item["existsInDb"]]
        return {"total": len(items), "groups": items, "existsInDb": exists_in_db, "missing": missing}


class VkGatewayService(BaseGatewayService):
    def __init__(self, client: VkServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(client or VkServiceClient(), auth_service)


def get_content_gateway_service() -> ContentGatewayService:
    return ContentGatewayService()


def get_vk_gateway_service() -> VkGatewayService:
    return VkGatewayService()

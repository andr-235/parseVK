from __future__ import annotations

import logging

from app.clients.content.client import ContentServiceClient
from app.clients.vk_service.client import VkServiceClient
from app.core.exceptions import BackendServiceError, BackendUnavailableError
from app.modules._base import BaseGatewayService, forward_service_request
from app.modules.auth.service import GatewayAuthService
from app.modules.content.mappers.group_mapper import (
    group_exists_in_database,
    map_vk_group_to_item,
)
from app.modules.content.schemas import GroupMergeResponse

logger = logging.getLogger(__name__)


class ContentGatewayService(BaseGatewayService):
    def __init__(self, client: ContentServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(
            client or ContentServiceClient(),
            auth_service,
        )

    async def merge_groups(
        self,
        vk_groups: list[dict],
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> GroupMergeResponse:
        vk_ids = [group["id"] for group in vk_groups]
        try:
            existing = await forward_service_request(
                self.client,
                "POST",
                "/internal/content/groups/bulk",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                json=vk_ids,
            )
        except (BackendServiceError, BackendUnavailableError) as exc:
            logger.warning("Failed to fetch existing groups from content service: %s", exc)
            existing = []

        existing_ids = {group["vkId"] for group in existing}
        items = []
        for group in vk_groups:
            group_id = group.get("id")
            exists_in_database = group_exists_in_database(group_id, existing_ids)
            items.append(map_vk_group_to_item(group, exists_in_database))

        exists_in_database = [item for item in items if item["exists_in_db"]]
        missing = [item for item in items if not item["exists_in_db"]]
        return GroupMergeResponse(
            total=len(items),
            groups=items,
            exists_in_db=exists_in_database,
            missing=missing,
        )

    async def search_region_groups(
        self,
        vk_service: VkGatewayService,
        query: str | None,
        *,
        user_id: str | None = None,
        request_id: str | None = None,
        correlation_id: str | None = None,
    ) -> GroupMergeResponse:
        """Search VK groups by region and merge with database status."""
        params = {}
        if query:
            params["query"] = query

        try:
            vk_groups = await forward_service_request(
                vk_service.client,
                "GET",
                "/internal/vk/groups/search/region",
                user_id=user_id,
                request_id=request_id,
                correlation_id=correlation_id,
                params=params,
            )
        except (BackendServiceError, BackendUnavailableError) as exc:
            logger.error("VK service search failed: %s", exc)
            raise

        if not vk_groups:
            return GroupMergeResponse(total=0, groups=[], exists_in_db=[], missing=[])

        return await self.merge_groups(
            vk_groups,
            user_id=user_id,
            request_id=request_id,
            correlation_id=correlation_id,
        )


class VkGatewayService(BaseGatewayService):
    def __init__(self, client: VkServiceClient | None = None, auth_service: GatewayAuthService | None = None):
        super().__init__(client or VkServiceClient(), auth_service)


def get_content_gateway_service() -> ContentGatewayService:
    return ContentGatewayService()


def get_vk_gateway_service() -> VkGatewayService:
    return VkGatewayService()

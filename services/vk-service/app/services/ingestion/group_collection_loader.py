from collections.abc import Callable
from typing import Any

from app.domain.exceptions.vk_api import VkApiAuthError
from app.services.ingestion.result import IngestionResult


class GroupCollectionLoader:
    def __init__(
        self,
        *,
        group_collector,
        post_collector,
        on_error: Callable[[str], str],
    ) -> None:
        self.groups = group_collector
        self.posts = post_collector
        self.on_error = on_error

    async def collect_group(
        self,
        group_id: int,
        correlation_id: str | None,
        result: IngestionResult,
    ) -> bool:
        try:
            await self.groups.collect_group(
                group_id,
                correlation_id=correlation_id,
            )
        except VkApiAuthError:
            raise
        except Exception as error:
            result.errors.append(
                {"group_id": group_id, "error": self.on_error(str(error))}
            )
            return False
        result.groups += 1
        return True

    async def load_posts(
        self,
        group_id: int,
        task_run: Any,
        profiles: dict[int, dict],
        correlation_id: str | None,
        result: IngestionResult,
    ) -> list[dict] | None:
        try:
            return await self.posts.collect_for_group(
                group_id,
                task_run,
                profiles,
                correlation_id=correlation_id,
            )
        except VkApiAuthError:
            raise
        except Exception as error:
            result.errors.append(
                {"group_id": group_id, "error": self.on_error(str(error))}
            )
            return None

from typing import Protocol


class VkProfilesClient(Protocol):
    async def get_profiles(
        self,
        vk_author_ids: list[int],
        fields: list[str],
    ) -> list[dict]: ...


class PhotoSummaryClient(Protocol):
    enrichment_budget_seconds: float

    async def summaries_by_vk_author_ids(
        self,
        vk_author_ids: list[int],
    ) -> dict[int, dict]: ...

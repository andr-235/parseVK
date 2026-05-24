from datetime import datetime, timezone


class FakeVkApiClient:
    async def get_groups(self, group_ids: list[int]) -> list[dict]:
        return [
            {
                "id": group_id,
                "screen_name": f"group{group_id}",
                "name": f"VK Group {group_id}",
                "is_closed": 0,
            }
            for group_id in group_ids
        ]

    async def get_posts(self, group_id: int, *, mode: str, post_limit: int | None) -> list[dict]:
        limit = post_limit or 1
        now = int(datetime(2026, 5, 8, tzinfo=timezone.utc).timestamp())
        return [
            {
                "id": index + 1,
                "owner_id": -abs(group_id),
                "from_id": -abs(group_id),
                "date": now + index,
                "text": f"Post {index + 1} from group {group_id}",
            }
            for index in range(limit)
        ]

    async def get_comments(self, owner_id: int, post_id: int) -> list[dict]:
        return [
            {
                "id": post_id * 1000 + 1,
                "owner_id": owner_id,
                "post_id": post_id,
                "from_id": 100000 + post_id,
                "date": int(datetime(2026, 5, 8, tzinfo=timezone.utc).timestamp()),
                "text": f"Comment for {owner_id}_{post_id}",
            }
        ]

    async def get_author_comments_for_post(
        self,
        owner_id: int,
        post_id: int,
        author_vk_id: int,
        baseline: datetime | None = None,
        batch_size: int = 100,
        max_pages: int = 10,
        thread_items_count: int = 10,
    ) -> list[dict]:
        return [
            {
                "id": post_id * 1000 + 1,
                "owner_id": owner_id,
                "post_id": post_id,
                "from_id": author_vk_id,
                "date": int(datetime(2026, 5, 8, tzinfo=timezone.utc).timestamp()),
                "text": f"Comment for {owner_id}_{post_id} by author {author_vk_id}",
            }
        ]

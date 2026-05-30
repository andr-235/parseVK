from datetime import datetime, timezone


class FakeVkApiClient:
    async def get_groups(self, group_ids: list[int], fields: list[str] | None = None) -> list[dict]:
        res = []
        for group_id in group_ids:
            if group_id == 40023088:
                res.append({
                    "id": group_id,
                    "screen_name": "livebir",
                    "name": "Биробиджан | livebir",
                    "is_closed": 0,
                    "members_count": 48500,
                })
            else:
                res.append({
                    "id": group_id,
                    "screen_name": f"group{group_id}",
                    "name": f"VK Group {group_id}",
                    "is_closed": 0,
                    "members_count": 5000,
                })
        return res

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

    async def get_user_photos(self, user_id: int, count: int = 100, offset: int = 0) -> list[dict]:
        return [
            {
                "id": 100 + index,
                "owner_id": user_id,
                "album_id": -6,
                "date": 1716500000 + index,
                "text": f"Photo {index} description",
                "sizes": [
                    {"type": "s", "url": "https://example.com/s.jpg", "width": 75, "height": 75},
                    {"type": "m", "url": "https://example.com/m.jpg", "width": 130, "height": 130},
                    {"type": "x", "url": "https://example.com/x.jpg", "width": 604, "height": 604},
                ]
            }
            for index in range(min(count, 5))
        ]

    async def get_users(self, user_ids: list[int], fields: list[str]) -> list[dict]:
        return [
            {
                "id": uid,
                "first_name": f"User_{uid}",
                "last_name": f"Last_{uid}",
                "deactivated": None,
                "domain": f"id{uid}",
                "screen_name": f"user{uid}",
                "photo_50": "https://vk.com/images/camera_50.png",
                "photo_100": "https://vk.com/images/camera_100.png",
                "photo_200": "https://vk.com/images/camera_200.png",
                "city": {"id": 1, "title": "Yakutsk"},
                "country": {"id": 1, "title": "Russia"},
                "verified": 1 if uid % 2 == 0 else 0,
            }
            for uid in user_ids
        ]

    async def friends_get(self, **params) -> dict:
        count = params.get("count", 1000)
        offset = params.get("offset", 0)
        total = 15
        items = []
        if offset < total:
            items = [
                {
                    "id": 200000 + i,
                    "first_name": f"Friend_{i}",
                    "last_name": f"Last_{i}",
                    "sex": 1 if i % 2 == 0 else 2,
                    "online": i % 3 == 0,
                    "domain": f"id200000_{i}",
                }
                for i in range(offset, min(offset + count, total))
            ]
        return {
            "count": total,
            "items": items
        }

    async def search_groups_by_region(self, *, query: str | None = None) -> list[dict]:
        all_groups = [
            {
                "id": 40023088,
                "screen_name": "livebir",
                "name": "Биробиджан | livebir",
                "is_closed": 0,
                "type": "group",
                "photo_50": "https://vk.com/images/community_50.png",
                "photo_100": "https://vk.com/images/community_100.png",
                "photo_200": "https://vk.com/images/community_200.png",
                "description": "Главное сообщество города Биробиджан и Еврейской автономной области. Новости, события, обсуждения.",
                "members_count": 48500,
                "activity": "Новости и СМИ",
                "status": "Биробиджан в эфире",
                "verified": 1,
            },
            {
                "id": 77700001,
                "screen_name": "overhear_bir",
                "name": "Подслушано Биробиджан",
                "is_closed": 0,
                "type": "group",
                "photo_50": "https://vk.com/images/community_50.png",
                "photo_100": "https://vk.com/images/community_100.png",
                "photo_200": "https://vk.com/images/community_200.png",
                "description": "Откровения, секреты и истории жителей Биробиджана. Анонимно.",
                "members_count": 32100,
                "activity": "Юмор",
                "status": "Твой анонимный Биробиджан",
                "verified": 0,
            },
            {
                "id": 77700002,
                "screen_name": "eao_news",
                "name": "Новости ЕАО",
                "is_closed": 0,
                "type": "page",
                "photo_50": "https://vk.com/images/community_50.png",
                "photo_100": "https://vk.com/images/community_100.png",
                "photo_200": "https://vk.com/images/community_200.png",
                "description": "Официальные и актуальные новости Еврейской автономной области в реальном времени.",
                "members_count": 15400,
                "activity": "Городской портал",
                "status": "В курсе всех событий региона",
                "verified": 1,
            },
            {
                "id": 77700003,
                "screen_name": "obluchye_city",
                "name": "Облучье Сити",
                "is_closed": 0,
                "type": "group",
                "photo_50": "https://vk.com/images/community_50.png",
                "photo_100": "https://vk.com/images/community_100.png",
                "photo_200": "https://vk.com/images/community_200.png",
                "description": "Сообщество жителей города Облучье и Облученского района ЕАО. Общение и новости.",
                "members_count": 8900,
                "activity": "Открытая группа",
                "status": "Любимый город Облучье",
                "verified": 0,
            },
            {
                "id": 77700004,
                "screen_name": "leninskoe_eao",
                "name": "Ленинское ЕАО",
                "is_closed": 0,
                "type": "group",
                "photo_50": "https://vk.com/images/community_50.png",
                "photo_100": "https://vk.com/images/community_100.png",
                "photo_200": "https://vk.com/images/community_200.png",
                "description": "Информационный ресурс села Ленинское и Ленинского района Еврейской автономной области.",
                "members_count": 6200,
                "activity": "Сообщество",
                "status": "Жизнь Ленинского района",
                "verified": 0,
            }
        ]
        
        if not query:
            return all_groups
            
        q = query.lower().strip()
        return [
            g for g in all_groups
            if q in g["name"].lower() or q in g["screen_name"].lower() or (g.get("description") and q in g["description"].lower())
        ]



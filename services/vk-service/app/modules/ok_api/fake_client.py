class FakeOkApiClient:
    async def friends_get(self, **params) -> list[str]:
        # Emulate total of 15 friends
        total = 15
        offset = int(params.get("offset", 0))
        limit = int(params.get("limit", 5000))
        
        friends = []
        if offset < total:
            friends = [str(200000 + i) for i in range(offset, min(offset + limit, total))]
        return friends

    async def users_get_info(self, uids: list[str], fields: str | None = None, empty_pictures: bool = True) -> list[dict]:
        results = []
        for uid in uids:
            i = int(uid) - 200000
            results.append({
                "uid": uid,
                "first_name": f"OK_Friend_{i}",
                "last_name": f"OK_Last_{i}",
                "name": f"OK_Friend_{i} OK_Last_{i}",
                "gender": "female" if i % 2 == 0 else "male",
                "birthday": "1990-05-15" if i % 2 == 0 else "1985-11-22",
                "age": 36 if i % 2 == 0 else 40,
                "online": "true" if i % 3 == 0 else "false",
                "pic190x190": f"https://example.com/ok_pic_{i}.jpg",
                "url_profile": f"https://ok.ru/profile/{uid}",
                "location": {
                    "city": "Moscow" if i % 2 == 0 else "Saint Petersburg",
                    "country": "Russia",
                }
            })
        return results

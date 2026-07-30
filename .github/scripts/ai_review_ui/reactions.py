from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any, Protocol


class ReactionApi(Protocol):
    repository: str

    def request(
        self,
        method: str,
        path: str,
        body: Mapping[str, Any] | None = None,
    ) -> Any: ...

    def paginated(self, path: str) -> Iterable[Any]: ...


def bot_reactions(api: ReactionApi, number: int) -> tuple[Mapping[str, Any], ...]:
    path = f"/repos/{api.repository}/issues/{number}/reactions"
    return tuple(
        item
        for item in api.paginated(path)
        if isinstance(item, Mapping)
        and isinstance(item.get("user"), Mapping)
        and item["user"].get("login") == "github-actions[bot]"
    )


def remove_reactions(api: ReactionApi, number: int) -> None:
    for reaction in bot_reactions(api, number):
        api.request(
            "DELETE",
            f"/repos/{api.repository}/issues/{number}/reactions/{reaction['id']}",
        )


def set_reaction(api: ReactionApi, number: int, content: str) -> None:
    remove_reactions(api, number)
    api.request(
        "POST",
        f"/repos/{api.repository}/issues/{number}/reactions",
        {"content": content},
    )

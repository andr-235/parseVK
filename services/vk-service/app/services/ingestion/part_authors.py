from typing import Any


class PartSourceIntegrityError(ValueError):
    """A staged provider observation cannot form a self-contained part."""


def comment_item_manifest(comments: list[dict[str, Any]]) -> tuple[str, ...]:
    values: list[str] = []
    for comment in comments:
        values.extend(_comment_identities(comment))
    return tuple(values)


def referenced_author_ids(
    post: dict[str, Any],
    comments: list[dict[str, Any]],
) -> tuple[int, ...]:
    values: set[int] = set()
    if post.get("from_id") is not None:
        values.add(_integer(post["from_id"], "post from_id"))
    for comment in comments:
        _collect_author_ids(comment, values)
    return tuple(sorted(values))


def author_records(
    author_ids: tuple[int, ...],
    *,
    profiles: list[dict[str, Any]],
    groups: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    providers: dict[int, dict[str, Any]] = {}
    for profile in profiles:
        providers[_positive_id(profile, "profile")] = profile
    for group in groups:
        providers[-_positive_id(group, "group")] = group
    return [_author_record(author_id, providers.get(author_id)) for author_id in author_ids]


def normalized_staged_authors(authors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records = []
    for author in authors:
        author_id = _integer(author.get("vk_author_id"), "staged author id")
        author_type = author.get("type")
        expected = "group" if author_id < 0 else "user"
        if author_type != expected:
            raise PartSourceIntegrityError("staged author type conflicts with identity")
        records.append(
            {
                "vkAuthorId": author_id,
                "type": author_type,
                "displayName": author.get("display_name") or str(author_id),
                "providerData": dict(author),
            }
        )
    return sorted(records, key=lambda value: value["vkAuthorId"])


def _comment_identities(comment: dict[str, Any]) -> list[str]:
    comment_id = _integer(comment.get("id"), "comment id")
    values = [f"comment:{comment_id}"]
    thread = comment.get("thread") or {}
    for child in thread.get("items") or []:
        values.extend(_comment_identities(child))
    return values


def _collect_author_ids(comment: dict[str, Any], values: set[int]) -> None:
    if comment.get("from_id") is not None:
        values.add(_integer(comment["from_id"], "comment from_id"))
    thread = comment.get("thread") or {}
    for child in thread.get("items") or []:
        _collect_author_ids(child, values)


def _author_record(author_id: int, provider: dict[str, Any] | None) -> dict[str, Any]:
    author_type = "group" if author_id < 0 else "user"
    data = dict(provider) if provider is not None else {"id": abs(author_id)}
    display_name = (
        data.get("name")
        or f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        or str(author_id)
    )
    return {
        "vkAuthorId": author_id,
        "type": author_type,
        "displayName": display_name,
        "providerData": data,
    }


def _positive_id(value: dict[str, Any], label: str) -> int:
    identifier = _integer(value.get("id"), f"{label} id")
    if identifier <= 0:
        raise PartSourceIntegrityError(f"{label} id must be positive")
    return identifier


def _integer(value: object, label: str) -> int:
    if type(value) is not int or value == 0:
        raise PartSourceIntegrityError(f"{label} must be a nonzero integer")
    return value

import pytest

from app.services.ingestion.part_authors import (
    PartSourceIntegrityError,
    author_records,
    comment_item_manifest,
    normalized_staged_authors,
    referenced_author_ids,
)


def test_duplicate_comment_identity_is_rejected() -> None:
    comments = [
        {"id": 1, "from_id": 10},
        {"id": 1, "from_id": 11},
    ]

    with pytest.raises(PartSourceIntegrityError, match="duplicate identities"):
        comment_item_manifest(comments)


def test_malformed_nested_thread_is_rejected_as_integrity_error() -> None:
    comments = [{"id": 1, "from_id": 10, "thread": {"items": ["bad"]}}]

    with pytest.raises(PartSourceIntegrityError, match="thread items"):
        comment_item_manifest(comments)
    with pytest.raises(PartSourceIntegrityError, match="thread items"):
        referenced_author_ids({"from_id": -42}, comments)


def test_conflicting_provider_identity_is_rejected() -> None:
    with pytest.raises(PartSourceIntegrityError, match="conflicting records"):
        author_records(
            (5,),
            profiles=[
                {"id": 5, "first_name": "First"},
                {"id": 5, "first_name": "Changed"},
            ],
            groups=[],
        )


def test_duplicate_staged_author_identity_is_rejected() -> None:
    authors = [
        {"vk_author_id": -42, "type": "group", "display_name": "A"},
        {"vk_author_id": -42, "type": "group", "display_name": "B"},
    ]

    with pytest.raises(PartSourceIntegrityError, match="duplicate identities"):
        normalized_staged_authors(authors)

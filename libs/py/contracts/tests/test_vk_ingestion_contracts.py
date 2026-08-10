import pytest
from pydantic import ValidationError

from parsevk_contracts.vk.ingestion import (
    CATALOG,
    COMMENT_PART_EVENT,
    POST_PART_EVENT,
    TOPIC,
    VkIngestionCommentPartPreparedV1,
    VkIngestionPostPartPreparedV1,
)


def payload(part_kind: str, source_kind: str) -> dict:
    return {
        "batchId": "11111111-1111-1111-1111-111111111111",
        "partId": "22222222-2222-2222-2222-222222222222",
        "partKind": part_kind,
        "partIndex": 0,
        "partCount": 1,
        "versions": {
            "stagingSchema": 1,
            "packing": 1,
            "eventContract": 1,
        },
        "source": {
            "kind": source_kind,
            "ownerId": -42,
            "postId": 99,
            "pageOffset": 0,
            "nextOffset": None,
            "providerMetadata": {"count": 1},
        },
        "post": {"owner_id": -42, "id": 99},
        "comments": [],
        "authors": [],
    }


def test_catalog_declares_exact_topic_roles_and_partition_key() -> None:
    assert {contract.message_type for contract in CATALOG.contracts} == {
        POST_PART_EVENT,
        COMMENT_PART_EVENT,
    }
    for contract in CATALOG.contracts:
        assert contract.topic == TOPIC
        assert contract.producers == frozenset({"vk-service"})
        assert contract.consumers == frozenset({"content-service"})
        assert contract.partition_key.paths == (
            "payload.source.ownerId",
            "payload.source.postId",
        )
        assert contract.partition_key.separator == ":"


def test_post_and_comment_payloads_validate_camel_case_wire_shape() -> None:
    post = VkIngestionPostPartPreparedV1.model_validate(
        payload("post", "post_snapshot")
    )
    comments = VkIngestionCommentPartPreparedV1.model_validate(
        payload("comments", "comment_page")
    )

    assert post.source.owner_id == comments.source.owner_id == -42
    assert post.model_dump(by_alias=True)["versions"]["eventContract"] == 1


def test_contract_rejects_wrong_source_position_or_post_comments() -> None:
    with pytest.raises(ValidationError, match="source kind"):
        VkIngestionPostPartPreparedV1.model_validate(
            payload("post", "comment_page")
        )

    invalid = payload("post", "post_snapshot")
    invalid["comments"] = [{"id": 1}]
    with pytest.raises(ValidationError, match="comments must be empty"):
        VkIngestionPostPartPreparedV1.model_validate(invalid)

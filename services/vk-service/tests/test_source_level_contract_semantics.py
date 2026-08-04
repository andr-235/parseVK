from uuid import uuid4

from app.services.collection_fingerprint import build_collection_identity


def test_task_metadata_does_not_participate_in_physical_identity():
    source_id = uuid4()
    first = build_collection_identity(
        provider_account_key="system-vk",
        source_provider="vk",
        source_type="community",
        source_external_id="42",
        source_owner_id=-42,
        post_strategy="latestByPublishedAt",
        post_limit=10,
        comment_mode="all",
        include_thread_replies=True,
    )
    second = build_collection_identity(
        provider_account_key="system-vk",
        source_provider="vk",
        source_type="community",
        source_external_id="42",
        source_owner_id=-42,
        post_strategy="latestByPublishedAt",
        post_limit=10,
        comment_mode="all",
        include_thread_replies=True,
    )

    assert source_id is not None
    assert first.source_key == "vk:community:42"
    assert first.fingerprint == second.fingerprint
    assert "taskRunId" not in first.normalized_plan
    assert "snapshotSha256" not in first.normalized_plan


def test_collection_plan_difference_changes_fingerprint():
    base = build_collection_identity(
        provider_account_key="system-vk",
        source_provider="vk",
        source_type="community",
        source_external_id="42",
        source_owner_id=-42,
        post_strategy="latestByPublishedAt",
        post_limit=10,
        comment_mode="all",
        include_thread_replies=True,
    )
    changed = build_collection_identity(
        provider_account_key="system-vk",
        source_provider="vk",
        source_type="community",
        source_external_id="42",
        source_owner_id=-42,
        post_strategy="latestByPublishedAt",
        post_limit=20,
        comment_mode="all",
        include_thread_replies=True,
    )

    assert base.fingerprint != changed.fingerprint

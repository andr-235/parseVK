from app.services.collection_fingerprint import build_collection_identity


def test_physical_identity_contains_only_source_and_collection_plan():
    identity = build_collection_identity(
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

    assert identity.source_key == "vk:community:42"
    assert set(identity.normalized_plan) == {
        "providerAccountKey",
        "source",
        "postSelection",
        "commentSelection",
    }
    assert "taskRunId" not in identity.normalized_plan
    assert "snapshotSha256" not in identity.normalized_plan

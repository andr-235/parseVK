from app.services.collection_fingerprint import build_collection_identity


def test_source_key_represents_exactly_one_source():
    identity = build_collection_identity(
        provider_account_key="system-vk",
        source_provider="vk",
        source_type="community",
        source_external_id="808",
        source_owner_id=-808,
        post_strategy="latestByPublishedAt",
        post_limit=10,
        comment_mode="all",
        include_thread_replies=True,
    )

    assert identity.source_key == "vk:community:808"
    assert "groupIds" not in identity.normalized_plan
    assert identity.normalized_plan["source"]["externalId"] == "808"

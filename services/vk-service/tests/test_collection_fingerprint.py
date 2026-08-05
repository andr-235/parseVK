from app.services.collection_fingerprint import build_collection_identity


def make_identity(**overrides):
    values = {
        "provider_account_key": "system-vk",
        "source_provider": "vk",
        "source_type": "community",
        "source_external_id": "123",
        "source_owner_id": -123,
        "post_strategy": "latestByPublishedAt",
        "post_limit": 10,
        "comment_mode": "all",
        "include_thread_replies": True,
    }
    values.update(overrides)
    return build_collection_identity(**values)


def test_identity_is_stable_for_the_same_source_and_plan():
    first = make_identity()
    second = make_identity(source_external_id=123, source_owner_id=-123)

    assert first.source_key == "vk:community:123"
    assert first.fingerprint == second.fingerprint
    assert first.normalized_plan == second.normalized_plan
    assert first.normalized_plan["source"]["externalId"] == "123"
    assert "groupIds" not in first.normalized_plan
    assert "scope" not in first.normalized_plan


def test_identity_changes_for_account_source_or_collection_plan():
    identities = {
        make_identity().fingerprint,
        make_identity(provider_account_key="secondary-vk").fingerprint,
        make_identity(source_external_id="456", source_owner_id=-456).fingerprint,
        make_identity(post_limit=20).fingerprint,
        make_identity(comment_mode="owners_only").fingerprint,
        make_identity(include_thread_replies=False).fingerprint,
    }

    assert len(identities) == 6


def test_source_key_is_semantic_and_excludes_owner_id():
    identity = make_identity(source_owner_id=-999)

    assert identity.source_key == "vk:community:123"
    assert identity.normalized_plan["source"]["ownerId"] == -999

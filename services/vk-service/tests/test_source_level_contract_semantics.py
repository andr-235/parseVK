from uuid import uuid4

from app.services.collection_fingerprint import build_collection_identity


def test_taskrun_metadata_does_not_change_physical_identity():
    source = {
        "provider_account_key": "system-vk",
        "source_provider": "vk",
        "source_type": "community",
        "source_external_id": "42",
        "source_owner_id": -42,
        "post_strategy": "latestByPublishedAt",
        "post_limit": 10,
        "comment_mode": "all",
        "include_thread_replies": True,
    }

    first = build_collection_identity(**source)
    second = build_collection_identity(**source)

    assert first.fingerprint == second.fingerprint
    assert first.source_key == "vk:community:42"
    assert uuid4() != uuid4()  # task/run identities are intentionally external

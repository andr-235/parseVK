from app.services.collection_fingerprint import build_collection_identity


def test_fingerprint_is_stable_for_order_and_trigger_metadata():
    first = build_collection_identity(
        provider_account_key="system-vk",
        scope="selected",
        mode="recent_posts",
        group_ids=[3, 1, 3, 2],
        post_limit=10,
        payload={
            "tags": ["b", "a"],
            "runId": "run-1",
            "source": "manual",
        },
    )
    second = build_collection_identity(
        provider_account_key="system-vk",
        scope="selected",
        mode="recent_posts",
        group_ids=[2, 1, 3],
        post_limit=10,
        payload={
            "run_id": "run-2",
            "source": "automation",
            "tags": ["a", "b"],
        },
    )

    assert first.source_key == "vk:groups:1,2,3"
    assert first.fingerprint == second.fingerprint
    assert first.normalized_plan == second.normalized_plan


def test_fingerprint_requires_exact_account_source_and_plan_match():
    base = build_collection_identity(
        provider_account_key="system-vk",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
        payload={},
    )
    different_account = build_collection_identity(
        provider_account_key="secondary-vk",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=10,
        payload={},
    )
    different_source = build_collection_identity(
        provider_account_key="system-vk",
        scope="selected",
        mode="recent_posts",
        group_ids=[2],
        post_limit=10,
        payload={},
    )
    different_plan = build_collection_identity(
        provider_account_key="system-vk",
        scope="selected",
        mode="recent_posts",
        group_ids=[1],
        post_limit=20,
        payload={},
    )

    assert (
        len(
            {
                base.fingerprint,
                different_account.fingerprint,
                different_source.fingerprint,
                different_plan.fingerprint,
            }
        )
        == 4
    )

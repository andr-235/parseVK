from app.services.collection_fingerprint import build_collection_identity


def _identity(
    *,
    account: str = "system-vk",
    external_id: str = "1",
    post_limit: int = 10,
):
    return build_collection_identity(
        provider_account_key=account,
        source_provider="vk",
        source_type="community",
        source_external_id=external_id,
        source_owner_id=-int(external_id),
        post_strategy="latestByPublishedAt",
        post_limit=post_limit,
        comment_mode="all",
        include_thread_replies=True,
    )


def test_fingerprint_is_stable_for_the_same_physical_plan():
    first = _identity()
    second = _identity()

    assert first.source_key == "vk:community:1"
    assert first.fingerprint == second.fingerprint
    assert first.normalized_plan == second.normalized_plan


def test_fingerprint_requires_exact_account_source_and_plan_match():
    base = _identity()
    different_account = _identity(account="secondary-vk")
    different_source = _identity(external_id="2")
    different_plan = _identity(post_limit=20)

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

from uuid import uuid4

import pytest
from pydantic import ValidationError

from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)


def test_request_rejects_same_physical_source_with_different_source_ids():
    source_a = SourceReference(
        source_id=uuid4(),
        provider="vk",
        source_type="community",
        external_id="42",
        owner_id=-42,
    )
    source_b = SourceReference(
        source_id=uuid4(),
        provider="vk",
        source_type="community",
        external_id="42",
        owner_id=-42,
    )

    with pytest.raises(ValidationError, match="Duplicate physical VK source"):
        VkExecutionRequested(
            task_id=1,
            task_run_id=uuid4(),
            execution_id=uuid4(),
            owner_user_id="user-1",
            demands=(
                VkSourceDemandRequest(demand_id=uuid4(), source=source_a),
                VkSourceDemandRequest(demand_id=uuid4(), source=source_b),
            ),
            post_selection=PostSelection(
                strategy="latestByPublishedAt",
                limit_per_source=10,
            ),
            comment_selection=CommentSelection(
                mode="all",
                include_thread_replies=True,
            ),
            task_revision=1,
            source_set_revision=1,
            snapshot_sha256="a" * 64,
        )

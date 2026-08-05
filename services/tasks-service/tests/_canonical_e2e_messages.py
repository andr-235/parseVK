"""Canonical fixtures shared by the tasks E2E publisher."""

from dataclasses import dataclass
from uuid import UUID, uuid4

from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionCancelRequested,
    VkExecutionRequested,
    VkSourceDemandRequest,
)


@dataclass(frozen=True, slots=True)
class CanonicalE2EFixture:
    request: VkExecutionRequested
    cancellation: VkExecutionCancelRequested | None
    request_event_id: UUID
    cancel_event_id: UUID | None
    demand_id: UUID
    source_id: UUID
    source_owner_id: int

    def metadata(self) -> dict[str, object]:
        return {
            "taskId": self.request.task_id,
            "taskRunId": str(self.request.task_run_id),
            "executionId": str(self.request.execution_id),
            "demandId": str(self.demand_id),
            "sourceId": str(self.source_id),
            "sourceOwnerId": self.source_owner_id,
            "requestEventId": str(self.request_event_id),
            "cancelEventId": (
                str(self.cancel_event_id) if self.cancel_event_id else None
            ),
        }


def build_fixture(*, include_cancellation: bool) -> CanonicalE2EFixture:
    suffix = uuid4().int % 1_000_000
    task_run_id = uuid4()
    execution_id = uuid4()
    demand_id = uuid4()
    source_id = uuid4()
    task_id = 91_000_000 + suffix
    external_id = 700_000_000 + suffix
    source_owner_id = -external_id
    request = VkExecutionRequested(
        task_id=task_id,
        task_run_id=task_run_id,
        execution_id=execution_id,
        owner_user_id="e2e-user",
        demands=(
            VkSourceDemandRequest(
                demand_id=demand_id,
                source=SourceReference(
                    source_id=source_id,
                    provider="vk",
                    source_type="community",
                    external_id=str(external_id),
                    owner_id=source_owner_id,
                ),
            ),
        ),
        post_selection=PostSelection(
            strategy="latestByPublishedAt",
            limit_per_source=20,
        ),
        comment_selection=CommentSelection(
            mode="all",
            include_thread_replies=True,
        ),
        task_revision=4,
        source_set_revision=7,
        snapshot_sha256="a" * 64,
    )
    cancellation = None
    cancel_event_id = None
    if include_cancellation:
        cancellation = VkExecutionCancelRequested(
            task_id=task_id,
            task_run_id=task_run_id,
            execution_id=execution_id,
            owner_user_id="e2e-user",
            reason="canonical-e2e-cancel",
        )
        cancel_event_id = uuid4()
    return CanonicalE2EFixture(
        request=request,
        cancellation=cancellation,
        request_event_id=uuid4(),
        cancel_event_id=cancel_event_id,
        demand_id=demand_id,
        source_id=source_id,
        source_owner_id=source_owner_id,
    )

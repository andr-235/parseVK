"""Canonical request/cancel fixtures shared by the tasks E2E publisher."""

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
    cancellation: VkExecutionCancelRequested
    request_event_id: UUID
    cancel_event_id: UUID
    demand_id: UUID
    source_id: UUID

    def metadata(self) -> dict[str, object]:
        return {
            "taskId": self.request.task_id,
            "taskRunId": str(self.request.task_run_id),
            "executionId": str(self.request.execution_id),
            "demandId": str(self.demand_id),
            "sourceId": str(self.source_id),
            "requestEventId": str(self.request_event_id),
            "cancelEventId": str(self.cancel_event_id),
        }


def build_fixture() -> CanonicalE2EFixture:
    task_run_id = uuid4()
    execution_id = uuid4()
    demand_id = uuid4()
    source_id = uuid4()
    task_id = 91001
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
                    external_id="777001",
                    owner_id=-777001,
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
    cancellation = VkExecutionCancelRequested(
        task_id=task_id,
        task_run_id=task_run_id,
        execution_id=execution_id,
        owner_user_id="e2e-user",
        reason="canonical-e2e-cancel",
    )
    return CanonicalE2EFixture(
        request=request,
        cancellation=cancellation,
        request_event_id=uuid4(),
        cancel_event_id=uuid4(),
        demand_id=demand_id,
        source_id=source_id,
    )

import pytest
from sqlalchemy import select

from app.infrastructure.db.models.outbox import OutboxEvent
from app.infrastructure.db.repositories.outbox import SqlAlchemyOutboxRepository
from app.services.domain_events_service import OutboxService
from app.tasks.outbox_worker import kafka_key_for_event


class FakeOutboxRepository:
    def __init__(self):
        self.events = []

    async def add_event(self, **kwargs):
        self.events.append(kwargs)


@pytest.mark.anyio
async def test_outbox_service_uses_deterministic_dedupe_keys():
    repository = FakeOutboxRepository()
    service = OutboxService(repository)

    await service.emit_group_collected({"id": 1})
    await service.emit_execution_completed(
        task_id=10,
        run_id="run-10",
        owner_user_id="user-1",
        executor="vk-service",
        worker_id="worker-1",
        execution_sequence=1,
        processed_items=6,
        total_items=6,
    )

    assert [event.get("dedupe_key") for event in repository.events] == [
        None,
        "task.execution_completed:10:run-10:1",
    ]


def test_outbox_service_has_no_legacy_post_comment_emitters():
    service = OutboxService(FakeOutboxRepository())

    assert not hasattr(service, "emit_post_collected")
    assert not hasattr(service, "emit_comments_collected_batch")


def test_kafka_key_for_task_events_uses_task_id():
    assert (
        kafka_key_for_event(
            "task.execution_completed", {"taskId": 10}, "ignored"
        )
        == "10"
    )
    assert (
        kafka_key_for_event(
            "task.execution_started", {"taskId": 10}, "ignored"
        )
        == "10"
    )
    assert kafka_key_for_event("vk.group_collected", {}, "1") == "1"


@pytest.mark.anyio
async def test_execution_outcome_is_persisted_without_legacy_task_row(db_session):
    repository = SqlAlchemyOutboxRepository(db_session)
    service = OutboxService(repository, session=db_session)

    await service.emit_execution_completed(
        task_id=10,
        run_id="run-10",
        owner_user_id="user-1",
        executor="vk-service",
        worker_id="worker-1",
        execution_sequence=1,
        processed_items=6,
        total_items=6,
    )

    event = await db_session.scalar(
        select(OutboxEvent).where(
            OutboxEvent.event_type == "task.execution_completed"
        )
    )
    assert event is not None
    assert event.payload["runId"] == "run-10"
    assert event.payload["processedItems"] == 6

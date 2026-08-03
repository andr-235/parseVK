from datetime import UTC, datetime, timedelta

import pytest

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.infrastructure.db.repositories.executions import SqlAlchemyExecutionRepository
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.infrastructure.db.repositories.tasks import SqlAlchemyTaskEventsRepository
from app.tasks.execution_control import (
    ExecutionAttemptControl,
    ExecutionCancellationRequested,
    FenceLostError,
    FencedVkApiClient,
)


async def _claim(db_session, *, expired=False):
    account_repo = SqlAlchemyProviderAccountRepository(db_session)
    if await account_repo.get_by_key("system-vk") is None:
        await account_repo.upsert_system(
            account_key="system-vk",
            provider="vk",
            credential_version="version-1",
            capabilities=[SYSTEM_VK_CAPABILITY],
        )
    events = SqlAlchemyTaskEventsRepository(db_session)
    if await events.get_execution(10, "run-10") is None:
        await events.create_execution(
            task_id=10,
            owner_user_id="user-1",
            run_id="run-10",
            scope="selected",
            mode="recent_posts",
            group_ids=[1],
            post_limit=10,
            plan_snapshot={"groupIds": [1]},
            parent_execution_id=None,
        )
    return await SqlAlchemyExecutionRepository(db_session).claim_next(
        worker_id="same-worker",
        lease_expires_at=(
            datetime.now(UTC) - timedelta(seconds=1)
            if expired
            else datetime.now(UTC) + timedelta(minutes=1)
        ),
    )


@pytest.mark.anyio
async def test_commit_guard_rejects_stale_attempt_with_same_worker_id(db_session):
    first = await _claim(db_session, expired=True)
    second = await _claim(db_session)
    assert first is not None and second is not None
    control = ExecutionAttemptControl(claim=first, session_factory=None)

    with pytest.raises(FenceLostError):
        await control.ensure_active_in_session(db_session)


@pytest.mark.anyio
async def test_commit_guard_reports_durable_cancellation(db_session):
    claim = await _claim(db_session)
    assert claim is not None
    await SqlAlchemyTaskEventsRepository(db_session).request_cancellation(
        task_id=10,
        run_id="run-10",
        reason="task.cancelled",
    )
    control = ExecutionAttemptControl(claim=claim, session_factory=None)

    with pytest.raises(ExecutionCancellationRequested):
        await control.ensure_active_in_session(db_session)


@pytest.mark.anyio
async def test_fenced_client_checks_before_and_after_request():
    class Control:
        def __init__(self):
            self.checks = 0

        async def ensure_active(self):
            self.checks += 1

    class Client:
        async def get_groups(self, group_ids, fields=None):
            return [{"id": group_ids[0]}]

    control = Control()
    client = FencedVkApiClient(Client(), control)

    assert await client.get_groups([1]) == [{"id": 1}]
    assert control.checks == 2


@pytest.mark.anyio
async def test_fenced_iterator_checks_every_page_boundary():
    class Control:
        def __init__(self):
            self.checks = 0

        async def ensure_active(self):
            self.checks += 1

    class Client:
        async def iter_comment_pages(self, *_args, **_kwargs):
            yield {"items": [1]}
            yield {"items": [2]}

    control = Control()
    client = FencedVkApiClient(Client(), control)

    pages = [page async for page in client.iter_comment_pages(1, 2)]

    assert pages == [{"items": [1]}, {"items": [2]}]
    assert control.checks == 4

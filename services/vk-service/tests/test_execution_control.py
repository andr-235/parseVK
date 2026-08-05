from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest
from parsevk_contracts.vk.commands import (
    CommentSelection,
    PostSelection,
    SourceReference,
    VkExecutionRequested,
    VkSourceDemandRequest,
)
from sqlalchemy import select

from app.domain.entities.provider_account import SYSTEM_VK_CAPABILITY
from app.infrastructure.db.models.source_collections import VkTaskRunBinding
from app.infrastructure.db.repositories.canonical_cancellation import (
    CanonicalCancellationRepository,
)
from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.executions import (
    SqlAlchemyExecutionRepository,
)
from app.infrastructure.db.repositories.provider_accounts import (
    SqlAlchemyProviderAccountRepository,
)
from app.tasks.execution_control import (
    ExecutionAttemptControl,
    ExecutionCancellationRequested,
    FencedVkApiClient,
    FenceLostError,
)

COMMAND = VkExecutionRequested(
    task_id=10,
    task_run_id=UUID("00000000-0000-0000-0000-000000000010"),
    execution_id=UUID("10000000-0000-0000-0000-000000000010"),
    owner_user_id="user-1",
    demands=(
        VkSourceDemandRequest(
            demand_id=UUID("20000000-0000-0000-0000-000000000010"),
            source=SourceReference(
                source_id=UUID("30000000-0000-0000-0000-000000000010"),
                provider="vk",
                source_type="community",
                external_id="1",
                owner_id=-1,
            ),
        ),
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
    snapshot_sha256="1" * 64,
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
    binding = await db_session.scalar(
        select(VkTaskRunBinding.id).where(
            VkTaskRunBinding.command_execution_id == COMMAND.execution_id
        )
    )
    if binding is None:
        result = await CanonicalVkCommandRepository(
            db_session
        ).attach_command(COMMAND)
        assert result.outcome == "created"
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
    await CanonicalCancellationRepository(db_session).request_cancellation(
        task_id=COMMAND.task_id,
        run_id=str(COMMAND.task_run_id),
        execution_id=COMMAND.execution_id,
        owner_user_id=COMMAND.owner_user_id,
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
async def test_fenced_client_stops_before_request_when_fence_is_lost():
    class Control:
        async def ensure_active(self):
            raise FenceLostError("stale before request")

    class Client:
        def __init__(self):
            self.calls = 0

        async def get_groups(self, group_ids, fields=None):
            self.calls += 1
            return [{"id": group_ids[0]}]

    inner = Client()
    client = FencedVkApiClient(inner, Control())

    with pytest.raises(FenceLostError, match="before request"):
        await client.get_groups([1])

    assert inner.calls == 0


@pytest.mark.anyio
async def test_fenced_client_discards_response_when_fence_is_lost_after_request():
    class Control:
        def __init__(self):
            self.checks = 0

        async def ensure_active(self):
            self.checks += 1
            if self.checks == 2:
                raise FenceLostError("stale after response")

    class Client:
        def __init__(self):
            self.calls = 0

        async def get_groups(self, group_ids, fields=None):
            self.calls += 1
            return [{"id": group_ids[0]}]

    inner = Client()
    client = FencedVkApiClient(inner, Control())

    with pytest.raises(FenceLostError, match="after response"):
        await client.get_groups([1])

    assert inner.calls == 1


@pytest.mark.anyio
async def test_fenced_iterator_checks_before_and_after_every_page_request():
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
    assert control.checks == 5


@pytest.mark.anyio
async def test_fenced_iterator_stops_before_next_request_after_fence_loss():
    class Control:
        def __init__(self):
            self.checks = 0

        async def ensure_active(self):
            self.checks += 1
            if self.checks == 3:
                raise FenceLostError("stale between pages")

    class Client:
        def __init__(self):
            self.requests = []

        async def iter_comment_pages(self, *_args, **_kwargs):
            self.requests.append(1)
            yield {"items": [1]}
            self.requests.append(2)
            yield {"items": [2]}

    inner = Client()
    iterator = FencedVkApiClient(inner, Control()).iter_comment_pages(1, 2)

    assert await anext(iterator) == {"items": [1]}
    with pytest.raises(FenceLostError, match="between pages"):
        await anext(iterator)

    assert inner.requests == [1]

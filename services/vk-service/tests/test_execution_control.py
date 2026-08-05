from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from _canonical_runtime_helpers import (
    attach,
    cancel_command,
    make_command,
    seed_account,
)

from app.infrastructure.db.repositories.canonical_commands import (
    CanonicalVkCommandRepository,
)
from app.infrastructure.db.repositories.canonical_executions import (
    CanonicalExecutionRepository,
)
from app.tasks.execution_control import (
    ExecutionAttemptControl,
    ExecutionCancellationRequested,
    FencedVkApiClient,
    FenceLostError,
)


async def _attach_execution(db_session):
    await seed_account(db_session)
    command = make_command(task_id=10, source_id=uuid4(), external_id=1)
    attachment = await attach(db_session, command)
    assert attachment.outcome == "created"
    return command


async def _claim(db_session, *, expired: bool = False):
    return await CanonicalExecutionRepository(db_session).claim_next(
        worker_id="same-worker",
        lease_expires_at=(
            datetime.now(UTC) - timedelta(seconds=1)
            if expired
            else datetime.now(UTC) + timedelta(minutes=1)
        ),
    )


@pytest.mark.anyio
async def test_commit_guard_rejects_stale_attempt_with_same_worker_id(db_session):
    await _attach_execution(db_session)
    first = await _claim(db_session, expired=True)
    second = await _claim(db_session)
    assert first is not None and second is not None
    control = ExecutionAttemptControl(claim=first, session_factory=None)

    with pytest.raises(FenceLostError):
        await control.ensure_active_in_session(db_session)


@pytest.mark.anyio
async def test_commit_guard_reports_durable_cancellation(db_session):
    command = await _attach_execution(db_session)
    claim = await _claim(db_session)
    assert claim is not None
    await CanonicalVkCommandRepository(db_session).request_cancellation(
        cancel_command(command)
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

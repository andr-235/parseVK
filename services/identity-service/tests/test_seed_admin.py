import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app import cli
from app.core.config import settings


class FakeSession:
    def __init__(self, state):
        self.state = state

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return False

    async def scalar(self, statement):
        return self.state["user"]

    def add(self, value):
        if hasattr(value, "username"):
            self.state["user"] = value
            return
        self.state["outbox_events"].append(value)

    async def flush(self):
        if self.state["user"].id is None:
            self.state["user"].id = uuid4()

    async def commit(self):
        self.state["commits"] += 1

    async def execute(self, stmt):
        from app.db.models import OutboxEvent

        from sqlalchemy.dialects.postgresql import Insert

        if isinstance(stmt, Insert):
            params = stmt.compile().params
            event = OutboxEvent(
                event_type=params["event_type"],
                event_version=params["event_version"],
                aggregate_type=params["aggregate_type"],
                aggregate_id=params["aggregate_id"],
                payload={"payload": params["payload"]},
            )
            self.state["outbox_events"].append(event)
        return None


class FakeSessionFactory:
    def __init__(self, state):
        self.state = state

    def __call__(self):
        return FakeSession(self.state)


@pytest.mark.asyncio
async def test_seed_admin_is_idempotent(monkeypatch):
    state = {"user": None, "commits": 0, "outbox_events": []}
    session_factory = FakeSessionFactory(state)
    monkeypatch.setattr(cli, "AsyncSessionLocal", session_factory)
    monkeypatch.setattr(settings, "admin_username", "admin")
    monkeypatch.setattr(settings, "admin_password", "admin-password")
    monkeypatch.setattr(settings, "admin_email", "admin@example.com")

    await cli.seed_admin()
    await cli.seed_admin()

    assert state["commits"] == 1
    assert state["user"].username == "admin"
    assert state["user"].email == "admin@example.com"
    assert len(state["outbox_events"]) == 1
    assert state["outbox_events"][0].event_type == "identity.user_created"

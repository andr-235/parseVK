import sys
from pathlib import Path

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

    def add(self, user):
        self.state["user"] = user

    async def commit(self):
        self.state["commits"] += 1


class FakeSessionFactory:
    def __init__(self, state):
        self.state = state

    def __call__(self):
        return FakeSession(self.state)


@pytest.mark.asyncio
async def test_seed_admin_is_idempotent(monkeypatch):
    state = {"user": None, "commits": 0}
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

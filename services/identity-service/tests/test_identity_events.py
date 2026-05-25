import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.core.security import hash_password
from app.db.models import ROLE_ADMIN, User
from app.modules.auth.service import AuthService


class FakeUsersRepo:
    def __init__(self, user):
        self.user = user

    async def find_by_username(self, username):
        return self.user

    async def find_by_id(self, user_id):
        return self.user

    async def save_user(self, user):
        self.user = user

    async def revoke_all_refresh_tokens(self, user_id):
        return None


class FakeRefreshRepo:
    async def find_by_hash(self, token_hash):
        return None

    async def save_token(self, token):
        return None

    async def revoke_family(self, token_family_id):
        return None


class FakeOutbox:
    def __init__(self):
        self.events = []

    async def add_identity_event(self, event_type, user_id):
        self.events.append((event_type, user_id))


def make_user():
    return User(
        id=uuid4(),
        username="admin",
        password_hash=hash_password("password"),
        role=ROLE_ADMIN,
        is_active=True,
        is_superuser=True,
    )


@pytest.mark.asyncio
async def test_login_emits_identity_event():
    user = make_user()
    outbox = FakeOutbox()
    service = AuthService(
        users=FakeUsersRepo(user),
        refresh_tokens=FakeRefreshRepo(),
        outbox=outbox,
    )

    await service.login("admin", "password", user_agent=None, ip=None)

    assert outbox.events == [("identity.user_logged_in", str(user.id))]

import sys
from pathlib import Path
from uuid import uuid4

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.core.security import hash_password
from app.db.models import ROLE_ADMIN, RefreshToken, User, utc_now
from app.modules.auth.service import AuthError, AuthService
from app.modules.auth.tokens import hash_refresh_token


class FakeUsersRepo:
    def __init__(self, user: User | None):
        self.user = user
        self.revoked_all = False

    async def find_by_username(self, username: str):
        if self.user and self.user.username == username:
            return self.user
        return None

    async def find_by_id(self, user_id):
        if self.user and self.user.id == user_id:
            return self.user
        return None

    async def save_user(self, user):
        self.user = user

    async def revoke_all_refresh_tokens(self, user_id):
        self.revoked_all = True


class FakeRefreshRepo:
    def __init__(self):
        self.tokens: list[RefreshToken] = []
        self.revoked_family = None

    async def find_by_hash(self, token_hash: str):
        for token in self.tokens:
            if token.token_hash == token_hash:
                return token
        return None

    async def save_token(self, token: RefreshToken):
        self.tokens.append(token)

    async def revoke_family(self, token_family_id):
        self.revoked_family = token_family_id
        for token in self.tokens:
            if token.token_family_id == token_family_id:
                token.revoked_at = token.revoked_at or token.created_at


def make_user(active: bool = True) -> User:
    return User(
        id=uuid4(),
        username="admin",
        password_hash=hash_password("old-password"),
        role=ROLE_ADMIN,
        is_active=active,
        is_superuser=True,
    )


@pytest.mark.asyncio
async def test_login_rejects_wrong_password():
    service = AuthService(users=FakeUsersRepo(make_user()), refresh_tokens=FakeRefreshRepo())

    with pytest.raises(AuthError, match="Invalid credentials"):
        await service.login("admin", "wrong", user_agent=None, ip=None)


@pytest.mark.asyncio
async def test_login_issues_refresh_token():
    refresh_repo = FakeRefreshRepo()
    service = AuthService(users=FakeUsersRepo(make_user()), refresh_tokens=refresh_repo)

    result = await service.login("admin", "old-password", user_agent="ua", ip="127.0.0.1")

    assert result.user.username == "admin"
    assert result.access_token
    assert result.refresh_token
    assert len(refresh_repo.tokens) == 1


@pytest.mark.asyncio
async def test_refresh_reuse_revokes_family():
    user = make_user()
    refresh_repo = FakeRefreshRepo()
    service = AuthService(users=FakeUsersRepo(user), refresh_tokens=refresh_repo)
    first = await service.login("admin", "old-password", user_agent=None, ip=None)
    stored = refresh_repo.tokens[0]
    stored.revoked_at = utc_now()

    with pytest.raises(AuthError):
        await service.refresh(first.refresh_token, user_agent=None, ip=None)

    assert refresh_repo.revoked_family == stored.token_family_id


@pytest.mark.asyncio
async def test_logout_twice_is_idempotent():
    user = make_user()
    refresh_repo = FakeRefreshRepo()
    service = AuthService(users=FakeUsersRepo(user), refresh_tokens=refresh_repo)
    result = await service.login("admin", "old-password", user_agent=None, ip=None)

    await service.logout(result.refresh_token)
    await service.logout(result.refresh_token)

    stored = await refresh_repo.find_by_hash(hash_refresh_token(result.refresh_token))
    assert stored.revoked_at is not None


@pytest.mark.asyncio
async def test_password_change_revokes_old_sessions():
    users_repo = FakeUsersRepo(make_user())
    service = AuthService(users=users_repo, refresh_tokens=FakeRefreshRepo())

    result = await service.change_password(users_repo.user.id, "old-password", "new-password")

    assert result.refresh_token
    assert users_repo.revoked_all

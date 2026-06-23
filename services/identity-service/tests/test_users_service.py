from uuid import uuid4

import pytest
from app.db.models import ROLE_ADMIN, ROLE_USER, User
from app.modules.users.schemas import UpdateUserRequest, UserRole
from app.modules.users.service import AdminInvariantError, UsersService


def make_user(*, role: str = ROLE_USER, active: bool = True) -> User:
    return User(
        id=uuid4(),
        username=f"user-{uuid4().hex[:8]}",
        password_hash="hash",
        role=role,
        is_active=active,
        is_superuser=False,
        is_temporary_password=False,
    )


class FakeRepository:
    def __init__(self, user: User, active_admins: int = 1):
        self.user = user
        self.active_admins = active_admins
        self.revoked = False

    async def find_by_id_for_update(self, user_id):
        return self.user if self.user.id == user_id else None

    async def lock_active_admin_ids(self):
        ids = [self.user.id] if self.active_admins else []
        return ids + [uuid4() for _ in range(max(0, self.active_admins - 1))]

    async def update_user(self, user, updates):
        for key, value in updates.items():
            setattr(user, key, value)
        return user

    async def delete_user(self, user):
        self.user = None

    async def save_user(self, user):
        self.user = user

    async def revoke_all_refresh_tokens(self, user_id):
        self.revoked = True


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        UpdateUserRequest(role=UserRole.USER),
        UpdateUserRequest(is_active=False),
    ],
)
async def test_last_active_admin_cannot_be_demoted_or_deactivated(payload):
    repo = FakeRepository(make_user(role=ROLE_ADMIN), active_admins=1)
    service = UsersService(repo)

    with pytest.raises(AdminInvariantError):
        await service.update_user(repo.user.id, payload)


@pytest.mark.asyncio
async def test_last_active_admin_cannot_be_deleted():
    repo = FakeRepository(make_user(role=ROLE_ADMIN), active_admins=1)
    service = UsersService(repo)

    with pytest.raises(AdminInvariantError):
        await service.delete_user(repo.user.id)


@pytest.mark.asyncio
async def test_temporary_password_sets_flag_and_revokes_sessions():
    repo = FakeRepository(make_user())
    service = UsersService(repo)

    password = await service.set_temporary_password(repo.user.id)

    assert len(password) >= 16
    assert repo.user.is_temporary_password is True
    assert repo.revoked is True

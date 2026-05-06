from dataclasses import dataclass
from datetime import timedelta
from typing import Protocol
from uuid import UUID, uuid4

from app.core.jwt import issue_access_token
from app.core.security import hash_password, verify_password
from app.db.models import RefreshToken, User, utc_now
from app.modules.auth.tokens import (
    generate_refresh_token,
    hash_ip,
    hash_refresh_token,
    hash_user_agent,
    verify_refresh_token,
)
from app.modules.users.schemas import UserDto


class AuthError(Exception):
    def __init__(self, message: str = "Unauthorized"):
        self.message = message
        super().__init__(message)


class BadAuthRequest(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class UsersRepo(Protocol):
    async def find_by_username(self, username: str) -> User | None: ...
    async def find_by_id(self, user_id: UUID) -> User | None: ...
    async def save_user(self, user: User) -> None: ...
    async def revoke_all_refresh_tokens(self, user_id: UUID) -> None: ...


class RefreshTokensRepo(Protocol):
    async def find_by_hash(self, token_hash: str) -> RefreshToken | None: ...
    async def save_token(self, token: RefreshToken) -> None: ...
    async def revoke_family(self, token_family_id: UUID) -> None: ...


@dataclass(frozen=True)
class AuthResult:
    access_token: str
    refresh_token: str
    user: UserDto


class AuthService:
    def __init__(
        self,
        *,
        users: UsersRepo,
        refresh_tokens: RefreshTokensRepo,
        refresh_token_ttl_days: int = 30,
    ):
        self.users = users
        self.refresh_tokens = refresh_tokens
        self.refresh_token_ttl_days = refresh_token_ttl_days

    async def login(
        self, username: str, password: str, *, user_agent: str | None, ip: str | None
    ) -> AuthResult:
        user = await self.users.find_by_username(username)
        if not user or not verify_password(password, user.password_hash) or not user.is_active:
            raise AuthError("Invalid credentials")
        return await self._issue_auth_result(user, user_agent=user_agent, ip=ip)

    async def refresh(
        self, refresh_token: str, *, user_agent: str | None, ip: str | None
    ) -> AuthResult:
        token_hash = hash_refresh_token(refresh_token)
        stored = await self.refresh_tokens.find_by_hash(token_hash)
        if not stored or not verify_refresh_token(refresh_token, stored.token_hash):
            raise AuthError("Invalid refresh token")

        now = utc_now()
        if stored.revoked_at is not None or stored.expires_at <= now:
            await self.refresh_tokens.revoke_family(stored.token_family_id)
            raise AuthError("Invalid refresh token")

        user = await self.users.find_by_id(stored.user_id)
        if not user or not user.is_active:
            await self.refresh_tokens.revoke_family(stored.token_family_id)
            raise AuthError("Invalid refresh token")

        new_raw = generate_refresh_token()
        new_stored = self._build_refresh_token(
            user,
            raw_refresh_token=new_raw,
            token_family_id=stored.token_family_id,
            user_agent=user_agent,
            ip=ip,
        )
        stored.revoked_at = now
        stored.replaced_by_token_id = new_stored.id
        stored.last_used_at = now
        await self.refresh_tokens.save_token(new_stored)

        return AuthResult(
            access_token=issue_access_token(user_id=str(user.id), roles=[user.role]),
            refresh_token=new_raw,
            user=self._to_user_dto(user),
        )

    async def logout(self, refresh_token: str) -> None:
        stored = await self.refresh_tokens.find_by_hash(hash_refresh_token(refresh_token))
        if stored and stored.revoked_at is None:
            stored.revoked_at = utc_now()

    async def me(self, user_id: UUID) -> UserDto:
        user = await self.users.find_by_id(user_id)
        if not user or not user.is_active:
            raise AuthError("Unauthorized")
        return self._to_user_dto(user)

    async def change_password(
        self, user_id: UUID, old_password: str, new_password: str
    ) -> AuthResult:
        if old_password == new_password:
            raise BadAuthRequest("New password must differ from old password")
        user = await self.users.find_by_id(user_id)
        if not user or not user.is_active or not verify_password(old_password, user.password_hash):
            raise AuthError("Unauthorized")
        user.password_hash = hash_password(new_password)
        user.password_changed_at = utc_now()
        await self.users.revoke_all_refresh_tokens(user.id)
        await self.users.save_user(user)
        return await self._issue_auth_result(user, user_agent=None, ip=None)

    async def _issue_auth_result(
        self, user: User, *, user_agent: str | None, ip: str | None
    ) -> AuthResult:
        raw_refresh_token = generate_refresh_token()
        stored = self._build_refresh_token(
            user,
            raw_refresh_token=raw_refresh_token,
            token_family_id=uuid4(),
            user_agent=user_agent,
            ip=ip,
        )
        await self.refresh_tokens.save_token(stored)
        return AuthResult(
            access_token=issue_access_token(user_id=str(user.id), roles=[user.role]),
            refresh_token=raw_refresh_token,
            user=self._to_user_dto(user),
        )

    def _build_refresh_token(
        self,
        user: User,
        *,
        raw_refresh_token: str,
        token_family_id: UUID,
        user_agent: str | None,
        ip: str | None,
    ) -> RefreshToken:
        return RefreshToken(
            id=uuid4(),
            user_id=user.id,
            token_hash=hash_refresh_token(raw_refresh_token),
            token_family_id=token_family_id,
            expires_at=utc_now() + timedelta(days=self.refresh_token_ttl_days),
            user_agent_hash=hash_user_agent(user_agent),
            ip_hash=hash_ip(ip),
        )

    def _to_user_dto(self, user: User) -> UserDto:
        return UserDto(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
        )

from dataclasses import dataclass
from typing import Protocol
from uuid import UUID, uuid4

from app.core.security import hash_password, verify_password
from app.db.models import RefreshToken, User, utc_now
from app.modules.auth.jwt_service import JwtService
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


class OutboxRepo(Protocol):
    async def add_identity_event(self, event_type: str, user_id: str) -> None: ...


@dataclass(frozen=True)
class AuthResult:
    access_token: str
    refresh_token: str
    user: UserDto


class AuthService:
    def __init__(self, *, users, refresh_tokens, outbox=None, refresh_token_ttl_days=30, jwt_service=None):
        self.users = users
        self.refresh_tokens = refresh_tokens
        self.outbox = outbox
        self._jwt = jwt_service or JwtService(refresh_token_ttl_days=refresh_token_ttl_days)

    async def login(self, username: str, password: str, *, user_agent: str | None, ip: str | None) -> AuthResult:
        user = await self.users.find_by_username(username)
        if not user or not verify_password(password, user.password_hash) or not user.is_active:
            raise AuthError("Invalid credentials")
        await self._add_identity_event("identity.user_logged_in", str(user.id))
        return await self._issue_auth_result(user, user_agent=user_agent, ip=ip)

    async def refresh(self, refresh_token: str, *, user_agent: str | None, ip: str | None) -> AuthResult:
        token_hash = self._jwt.hash_token(refresh_token)
        stored = await self.refresh_tokens.find_by_hash(token_hash)
        if not stored or not self._jwt.verify_token(refresh_token, stored.token_hash):
            raise AuthError("Invalid refresh token")
        now = utc_now()
        if stored.revoked_at is not None or stored.expires_at <= now:
            await self.refresh_tokens.revoke_family(stored.token_family_id)
            raise AuthError("Invalid refresh token")
        user = await self.users.find_by_id(stored.user_id)
        if not user or not user.is_active:
            await self.refresh_tokens.revoke_family(stored.token_family_id)
            raise AuthError("Invalid refresh token")
        new_raw = self._jwt.generate_raw_refresh_token()
        new_stored = self._jwt.build_refresh_token(user, raw_refresh_token=new_raw, token_family_id=stored.token_family_id, user_agent=user_agent, ip=ip)
        stored.revoked_at = now
        stored.replaced_by_token_id = new_stored.id
        stored.last_used_at = now
        await self.refresh_tokens.save_token(new_stored)
        return AuthResult(
            access_token=self._jwt.issue_access_token(user_id=str(user.id), roles=[user.role]),
            refresh_token=new_raw,
            user=self._jwt.to_user_dto(user),
        )

    async def logout(self, refresh_token: str) -> None:
        stored = await self.refresh_tokens.find_by_hash(self._jwt.hash_token(refresh_token))
        if stored and stored.revoked_at is None:
            stored.revoked_at = utc_now()
            await self._add_identity_event("identity.user_logged_out", str(stored.user_id))

    async def me(self, user_id: UUID) -> UserDto:
        user = await self.users.find_by_id(user_id)
        if not user or not user.is_active:
            raise AuthError("Unauthorized")
        return self._jwt.to_user_dto(user)

    async def change_password(self, user_id: UUID, old_password: str, new_password: str) -> AuthResult:
        if old_password == new_password:
            raise BadAuthRequest("New password must differ from old password")
        user = await self.users.find_by_id(user_id)
        if not user or not user.is_active or not verify_password(old_password, user.password_hash):
            raise AuthError("Unauthorized")
        user.password_hash = hash_password(new_password)
        user.password_changed_at = utc_now()
        await self.users.revoke_all_refresh_tokens(user.id)
        await self.users.save_user(user)
        await self._add_identity_event("identity.password_changed", str(user.id))
        return await self._issue_auth_result(user, user_agent=None, ip=None)

    async def _issue_auth_result(self, user: User, *, user_agent: str | None, ip: str | None) -> AuthResult:
        raw_refresh_token = self._jwt.generate_raw_refresh_token()
        stored = self._jwt.build_refresh_token(user, raw_refresh_token=raw_refresh_token, token_family_id=uuid4(), user_agent=user_agent, ip=ip)
        await self.refresh_tokens.save_token(stored)
        return AuthResult(
            access_token=self._jwt.issue_access_token(user_id=str(user.id), roles=[user.role]),
            refresh_token=raw_refresh_token,
            user=self._jwt.to_user_dto(user),
        )

    async def _add_identity_event(self, event_type: str, user_id: str) -> None:
        if self.outbox is not None:
            await self.outbox.add_identity_event(event_type, user_id)

from datetime import timedelta
from uuid import UUID, uuid4

from app.core.jwt import issue_access_token
from app.db.models import RefreshToken, utc_now
from app.modules.auth.tokens import (
    generate_refresh_token,
    hash_ip,
    hash_refresh_token,
    hash_user_agent,
    verify_refresh_token,
)
from app.modules.users.schemas import UserDto


class JwtService:
    def __init__(self, refresh_token_ttl_days: int = 30):
        self.refresh_token_ttl_days = refresh_token_ttl_days

    def issue_access_token(self, user_id: str, roles: list[str]) -> str:
        return issue_access_token(user_id=user_id, roles=roles)

    def generate_raw_refresh_token(self) -> str:
        return generate_refresh_token()

    def hash_token(self, token: str) -> str:
        return hash_refresh_token(token)

    def verify_token(self, token: str, token_hash: str) -> bool:
        return verify_refresh_token(token, token_hash)

    def build_refresh_token(
        self,
        user,
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

    def to_user_dto(self, user) -> UserDto:
        return UserDto(
            id=user.id,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
        )

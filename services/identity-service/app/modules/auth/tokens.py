import hmac
import secrets

from common.security import stable_sha256


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return stable_sha256(token)


def verify_refresh_token(token: str, token_hash: str) -> bool:
    return hmac.compare_digest(hash_refresh_token(token), token_hash)


def hash_user_agent(value: str | None) -> str | None:
    return stable_sha256(value) if value else None


def hash_ip(value: str | None) -> str | None:
    return stable_sha256(value) if value else None

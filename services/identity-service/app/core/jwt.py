from datetime import datetime, timedelta, timezone
from functools import lru_cache
from uuid import uuid4

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core.config import Settings, settings


@lru_cache
def _dev_key_pair() -> tuple[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")
    public_pem = (
        private_key.public_key()
        .public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        .decode("utf-8")
    )
    return private_pem, public_pem


def get_private_key_pem(current_settings: Settings = settings) -> str:
    if current_settings.jwt_private_key_pem:
        return current_settings.jwt_private_key_pem
    return _dev_key_pair()[0]


def get_public_key_pem(current_settings: Settings = settings) -> str:
    if current_settings.jwt_public_key_pem:
        return current_settings.jwt_public_key_pem
    return _dev_key_pair()[1]


def issue_access_token(
    *,
    user_id: str,
    roles: list[str],
    current_settings: Settings = settings,
    now: datetime | None = None,
) -> str:
    issued_at = now or datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(minutes=current_settings.jwt_access_ttl_minutes)
    claims = {
        "iss": current_settings.jwt_issuer,
        "aud": current_settings.jwt_audience,
        "sub": user_id,
        "jti": str(uuid4()),
        "iat": issued_at,
        "nbf": issued_at,
        "exp": expires_at,
        "typ": "access",
        "roles": roles,
    }
    return jwt.encode(
        claims,
        get_private_key_pem(current_settings),
        algorithm="RS256",
        headers={"kid": current_settings.jwt_key_id},
    )


def build_jwks(current_settings: Settings = settings) -> dict[str, list[dict[str, object]]]:
    public_key = serialization.load_pem_public_key(
        get_public_key_pem(current_settings).encode("utf-8")
    )
    numbers = public_key.public_numbers()
    jwk = {
        "kty": "RSA",
        "use": "sig",
        "kid": current_settings.jwt_key_id,
        "alg": "RS256",
        "n": jwt.utils.base64url_encode(
            numbers.n.to_bytes((numbers.n.bit_length() + 7) // 8, "big")
        ).decode("ascii"),
        "e": jwt.utils.base64url_encode(
            numbers.e.to_bytes((numbers.e.bit_length() + 7) // 8, "big")
        ).decode("ascii"),
    }
    return {"keys": [jwk]}

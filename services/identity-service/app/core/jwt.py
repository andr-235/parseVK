from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from functools import lru_cache
from uuid import uuid4

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core.config import Settings, settings

JWT_ALGORITHM = "RS256"


@lru_cache
def _dev_key_pair() -> tuple[str, str]:
    """
    Development-only RSA key pair.

    Important:
    - generated once per process;
    - changes after service restart;
    - must not be used in production.
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

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


def _normalize_pem(value: str) -> str:
    return value.replace("\\n", "\n").strip()


def _utc_now() -> datetime:
    return datetime.now(UTC)


def get_private_key_pem(current_settings: Settings = settings) -> str:
    if current_settings.jwt_private_key_pem:
        return _normalize_pem(current_settings.jwt_private_key_pem)

    return _dev_key_pair()[0]


def get_public_key_pem(current_settings: Settings = settings) -> str:
    if current_settings.jwt_public_key_pem:
        return _normalize_pem(current_settings.jwt_public_key_pem)

    return _dev_key_pair()[1]


def issue_access_token(
    *,
    user_id: str,
    roles: Sequence[str],
    current_settings: Settings = settings,
    now: datetime | None = None,
) -> str:
    issued_at = now or _utc_now()

    if issued_at.tzinfo is None:
        issued_at = issued_at.replace(tzinfo=UTC)

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
        "roles": list(roles),
    }

    headers = {
        "kid": current_settings.jwt_key_id,
        "typ": "JWT",
    }

    return jwt.encode(
        payload=claims,
        key=get_private_key_pem(current_settings),
        algorithm=JWT_ALGORITHM,
        headers=headers,
    )


def build_jwks(
    current_settings: Settings = settings,
) -> dict[str, list[dict[str, object]]]:
    public_key = serialization.load_pem_public_key(
        get_public_key_pem(current_settings).encode("utf-8")
    )

    if not isinstance(public_key, rsa.RSAPublicKey):
        raise TypeError("JWT public key must be an RSA public key")

    numbers = public_key.public_numbers()

    jwk = {
        "kty": "RSA",
        "use": "sig",
        "kid": current_settings.jwt_key_id,
        "alg": JWT_ALGORITHM,
        "n": jwt.utils.base64url_encode(
            numbers.n.to_bytes(
                (numbers.n.bit_length() + 7) // 8,
                "big",
            )
        ).decode("ascii"),
        "e": jwt.utils.base64url_encode(
            numbers.e.to_bytes(
                (numbers.e.bit_length() + 7) // 8,
                "big",
            )
        ).decode("ascii"),
    }

    return {"keys": [jwk]}

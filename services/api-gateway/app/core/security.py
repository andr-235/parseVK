from typing import Any

import jwt
from jwt import PyJWKClientError
from jwt.algorithms import RSAAlgorithm

from common.security import stable_sha256

from app.core.config import settings


def hash_public_value(value: str) -> str:
    return stable_sha256(value)


def validate_access_token(token: str, jwks: dict[str, Any]) -> dict[str, Any]:
    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as exc:
        raise ValueError("Invalid access token") from exc

    if header.get("alg") != "RS256":
        raise ValueError("Invalid access token algorithm")

    key = None
    for candidate in jwks.get("keys", []):
        if candidate.get("kid") == header.get("kid"):
            key = RSAAlgorithm.from_jwk(candidate)
            break

    if key is None:
        raise ValueError("Unknown access token key")

    try:
        claims = jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
            options={"require": ["iss", "aud", "sub", "jti", "iat", "nbf", "exp", "typ"]},
        )
    except (jwt.InvalidTokenError, PyJWKClientError) as exc:
        raise ValueError("Invalid access token") from exc

    if claims.get("typ") != "access":
        raise ValueError("Invalid access token type")

    return claims

import secrets
from typing import Any

<<<<<<< HEAD
from fastapi import Header, HTTPException, status
=======
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
import jwt
from common.security import stable_sha256
from fastapi import Header, HTTPException, Request, status
from jwt import PyJWKClientError
from jwt.algorithms import RSAAlgorithm

<<<<<<< HEAD
from common.security import stable_sha256

=======
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
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


_jwks_cache: dict[str, Any] | None = None


async def get_jwks(force_refresh: bool = False) -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is None or force_refresh:
        from app.clients.identity.client import IdentityClient
        client = IdentityClient()
        try:
            _jwks_cache = await client.jwks()
        finally:
            await client.close()
    return _jwks_cache


async def require_internal_token(
    x_internal_service_token: str | None = Header(default=None, alias="X-Internal-Service-Token"),
) -> None:
    if not x_internal_service_token or x_internal_service_token != settings.internal_service_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


async def require_auth(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid credentials",
        )
    token = authorization.split(" ", 1)[1]
    
    jwks = await get_jwks()
    try:
        return validate_access_token(token, jwks)
    except Exception:
        # On validation failure (e.g. key rotated/unknown), force refresh JWKS cache and try once more
        try:
            jwks = await get_jwks(force_refresh=True)
            return validate_access_token(token, jwks)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token",
            ) from exc


def bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return authorization.split(" ", 1)[1]


def validate_csrf(request: Request, csrf_header: str | None) -> None:
    origin = request.headers.get("origin")
    if origin and origin not in settings.allowed_origins:
        raise HTTPException(status_code=403, detail="Invalid origin")
    csrf_cookie = request.cookies.get(settings.csrf_cookie_name)
    if csrf_cookie and (not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header)):
        raise HTTPException(status_code=403, detail="Invalid CSRF token")



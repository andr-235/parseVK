import sys
from pathlib import Path
from uuid import uuid4

import jwt

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.core.config import settings
from app.core.jwt import build_jwks, get_public_key_pem, issue_access_token


def test_access_token_contains_required_claims():
    token = issue_access_token(user_id=str(uuid4()), roles=["admin"])
    claims = jwt.decode(
        token,
        get_public_key_pem(),
        algorithms=["RS256"],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
    )

    assert claims["typ"] == "access"
    assert claims["aud"] == "api-gateway"
    assert claims["iss"] == "identity-service"
    assert claims["roles"] == ["admin"]
    assert claims["jti"]


def test_jwks_contains_configured_kid():
    jwks = build_jwks()

    assert jwks["keys"][0]["kid"] == settings.jwt_key_id
    assert jwks["keys"][0]["alg"] == "RS256"

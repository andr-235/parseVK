import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.modules.pop("_service_path", None)

from _service_path import use_service_path

use_service_path()

from app.core.security import validate_access_token


def key_pair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_numbers = private_key.public_key().public_numbers()
    jwks = {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "kid": "test-key",
                "alg": "RS256",
                "n": jwt.utils.base64url_encode(
                    public_numbers.n.to_bytes((public_numbers.n.bit_length() + 7) // 8, "big")
                ).decode("ascii"),
                "e": jwt.utils.base64url_encode(
                    public_numbers.e.to_bytes((public_numbers.e.bit_length() + 7) // 8, "big")
                ).decode("ascii"),
            }
        ]
    }
    return private_pem, jwks


def make_token(**overrides):
    private_pem, jwks = key_pair()
    now = datetime.now(UTC)
    claims = {
        "iss": "identity-service",
        "aud": "api-gateway",
        "sub": str(uuid4()),
        "jti": str(uuid4()),
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(minutes=10),
        "typ": "access",
        "roles": ["admin"],
    }
    claims.update(overrides)
    token = jwt.encode(claims, private_pem, algorithm="RS256", headers={"kid": "test-key"})
    return token, jwks


def test_validate_access_token_accepts_valid_token():
    token, jwks = make_token()

    claims = validate_access_token(token, jwks)

    assert claims["typ"] == "access"


@pytest.mark.parametrize(
    ("claim", "value"),
    [
        ("aud", "wrong-audience"),
        ("iss", "wrong-issuer"),
        ("typ", "refresh"),
    ],
)
def test_validate_access_token_rejects_invalid_claims(claim, value):
    token, jwks = make_token(**{claim: value})

    with pytest.raises(ValueError):
        validate_access_token(token, jwks)


def test_validate_access_token_rejects_expired_token():
    token, jwks = make_token(exp=datetime.now(UTC) - timedelta(minutes=1))

    with pytest.raises(ValueError):
        validate_access_token(token, jwks)

from common.security import stable_sha256


def hash_public_value(value: str) -> str:
    return stable_sha256(value)

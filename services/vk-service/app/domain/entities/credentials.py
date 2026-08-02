import hashlib
from dataclasses import dataclass, field


@dataclass(frozen=True)
class CredentialMaterial:
    """Credential material for a provider account.

    `raw_secret` is infrastructure-only: it must never be logged, serialized
    or included in exception messages.
    """

    raw_secret: str = field(repr=False)
    version_digest: str
    display_version: str

    @classmethod
    def from_secret(cls, raw_secret: str) -> "CredentialMaterial":
        digest = hashlib.sha256(raw_secret.encode("utf-8")).hexdigest()
        return cls(
            raw_secret=raw_secret,
            version_digest=digest,
            display_version=digest[:12],
        )

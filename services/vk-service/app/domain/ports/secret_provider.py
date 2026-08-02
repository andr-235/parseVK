from typing import Protocol

from app.domain.entities.credentials import CredentialMaterial


class SecretProviderError(RuntimeError):
    """Raised when a configured secret source is missing or unreadable."""


class SecretProvider(Protocol):
    """Port for loading provider credentials (mounted file or env)."""

    def load(self) -> CredentialMaterial: ...

from typing import Protocol

from app.domain.entities.credentials import CredentialMaterial


class SecretProviderError(RuntimeError):
    """Raised when the mounted credential file is missing or unreadable."""


class SecretProvider(Protocol):
    """Port for loading provider credentials from the mounted file."""

    def load(self) -> CredentialMaterial: ...

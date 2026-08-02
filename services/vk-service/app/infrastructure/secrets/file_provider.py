import logging
from pathlib import Path

from app.core.redaction import register_secret
from app.domain.entities.credentials import CredentialMaterial
from app.domain.ports.secret_provider import SecretProvider, SecretProviderError

logger = logging.getLogger(__name__)


class FileSecretProvider:
    """Loads the raw secret from a mounted file, re-reading only on change."""

    def __init__(self, token_file: str):
        self._path = Path(token_file)
        self._cached: CredentialMaterial | None = None
        self._cached_mtime: float | None = None

    def load(self) -> CredentialMaterial:
        try:
            stat = self._path.stat()
        except OSError as exc:
            raise SecretProviderError(
                f"VK_SERVICE_TOKEN_FILE is not readable: {self._path}"
            ) from exc

        if self._cached is not None and stat.st_mtime == self._cached_mtime:
            return self._cached

        try:
            raw = self._path.read_text(encoding="utf-8").strip()
        except OSError as exc:
            raise SecretProviderError(
                f"VK_SERVICE_TOKEN_FILE is not readable: {self._path}"
            ) from exc

        if not raw:
            raise SecretProviderError(f"VK_SERVICE_TOKEN_FILE is empty: {self._path}")

        material = CredentialMaterial.from_secret(raw)
        register_secret(raw)
        logger.debug("re-read token file %s (mtime %s)", self._path, stat.st_mtime)
        self._cached = material
        self._cached_mtime = stat.st_mtime
        return material

"""Tests for mounted-file credentials and credential material."""

import hashlib
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.entities.credentials import CredentialMaterial
from app.domain.ports.secret_provider import SecretProviderError
from app.infrastructure.secrets import build_secret_provider
from app.infrastructure.secrets.file_provider import FileSecretProvider


def test_credential_material_computes_digest_and_display_version():
    material = CredentialMaterial.from_secret("super-secret")
    assert material.raw_secret == "super-secret"
    assert material.version_digest == hashlib.sha256(b"super-secret").hexdigest()
    assert material.display_version == material.version_digest[:12]
    assert "super-secret" not in repr(material)


def test_file_provider_reads_and_strips(tmp_path: Path):
    token_file = tmp_path / "token.txt"
    token_file.write_text("  file-token\n", encoding="utf-8")

    provider = FileSecretProvider(str(token_file))
    material = provider.load()

    assert material.raw_secret == "file-token"
    assert material.version_digest == hashlib.sha256(b"file-token").hexdigest()


def test_file_provider_caches_by_mtime(tmp_path: Path, monkeypatch):
    import os

    token_file = tmp_path / "token.txt"
    token_file.write_text("v1", encoding="utf-8")

    provider = FileSecretProvider(str(token_file))
    first = provider.load()
    reads = []
    monkeypatch.setattr(
        Path,
        "read_text",
        lambda self, **kw: reads.append(1) or "v2",
    )

    assert provider.load() is first
    assert reads == []

    token_file.write_text("v2", encoding="utf-8")
    stat = token_file.stat()
    os.utime(token_file, (stat.st_mtime + 5, stat.st_mtime + 5))
    assert provider.load().raw_secret == "v2"


def test_file_provider_missing_file_raises(tmp_path: Path):
    provider = FileSecretProvider(str(tmp_path / "nope.txt"))
    with pytest.raises(SecretProviderError, match="not readable"):
        provider.load()


def test_file_provider_empty_file_raises(tmp_path: Path):
    token_file = tmp_path / "empty.txt"
    token_file.write_text("   ", encoding="utf-8")

    provider = FileSecretProvider(str(token_file))
    with pytest.raises(SecretProviderError, match="empty"):
        provider.load()


def test_provider_factory_defers_missing_mount_error_until_load():
    provider = build_secret_provider(SimpleNamespace(token_file=""))

    assert isinstance(provider, FileSecretProvider)
    with pytest.raises(SecretProviderError, match="TOKEN_FILE"):
        provider.load()


def test_provider_factory_builds_file_provider(tmp_path: Path):
    token_file = tmp_path / "token.txt"
    token_file.write_text("mounted-token", encoding="utf-8")

    provider = build_secret_provider(
        SimpleNamespace(token_file=str(token_file))
    )

    assert isinstance(provider, FileSecretProvider)
    assert provider.load().raw_secret == "mounted-token"

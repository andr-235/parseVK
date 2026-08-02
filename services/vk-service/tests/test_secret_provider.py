"""Tests for SecretProvider implementations and credential material."""

import hashlib
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.domain.entities.credentials import CredentialMaterial
from app.domain.ports.secret_provider import SecretProviderError
from app.infrastructure.secrets.env_provider import EnvSecretProvider
from app.infrastructure.secrets.file_provider import FileSecretProvider


class FakeSettings:
    vk_token = "legacy-token"


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

    monkeypatch.setattr(Path, "read_text", lambda self, **kw: reads.append(1) or "v2")

    cached = provider.load()
    assert cached is first
    assert reads == []

    token_file.write_text("v2", encoding="utf-8")
    stat = token_file.stat()
    os.utime(token_file, (stat.st_mtime + 5, stat.st_mtime + 5))
    updated = provider.load()
    assert updated.raw_secret == "v2"


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


def test_env_provider_uses_settings_token():
    provider = EnvSecretProvider(FakeSettings())
    material = provider.load()
    assert material.raw_secret == "legacy-token"
    assert material.display_version == hashlib.sha256(b"legacy-token").hexdigest()[:12]

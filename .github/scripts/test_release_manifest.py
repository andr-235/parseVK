from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from release_manifest import build_manifest, write_release_files
from service_catalog_test_support import make_catalog

DIGEST_A = "sha256:" + "a" * 64
DIGEST_B = "sha256:" + "b" * 64
COMMIT = "1" * 40


def write_record(
    directory: Path,
    service: str,
    digest: str,
    commit_sha: str = COMMIT,
) -> None:
    repository = f"ghcr.io/example/parsevk-{service}"
    record = {
        "service": service,
        "repository": repository,
        "tag": f"{repository}:sha-{commit_sha}",
        "digest": digest,
        "reference": f"{repository}@{digest}",
        "commit_sha": commit_sha,
    }
    directory.mkdir(parents=True, exist_ok=True)
    (directory / f"{service}.json").write_text(
        json.dumps(record), encoding="utf-8"
    )


class ReleaseManifestTests(unittest.TestCase):
    def test_builds_complete_digest_manifest_and_env(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            catalog = root / "catalog.yaml"
            metadata = root / "metadata"
            output = root / "release"
            make_catalog(catalog)
            write_record(metadata, "api", DIGEST_A)
            write_record(metadata, "frontend", DIGEST_B)

            manifest = build_manifest(
                catalog,
                metadata,
                "example/parsevk",
                COMMIT,
                "2026-07-30T00:00:00Z",
            )
            write_release_files(manifest, output)

            self.assertEqual(manifest["schema_version"], 1)
            self.assertEqual(list(manifest["images"]), ["api", "frontend"])
            self.assertEqual(
                manifest["images"]["api"]["reference"],
                f"ghcr.io/example/parsevk-api@{DIGEST_A}",
            )
            self.assertEqual(
                (output / "release.env").read_text(encoding="utf-8"),
                "\n".join(
                    [
                        f"RELEASE_COMMIT_SHA={COMMIT}",
                        f"API_IMAGE=ghcr.io/example/parsevk-api@{DIGEST_A}",
                        f"FRONTEND_IMAGE=ghcr.io/example/parsevk-frontend@{DIGEST_B}",
                        "",
                    ]
                ),
            )

    def test_missing_service_metadata_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            catalog = root / "catalog.yaml"
            metadata = root / "metadata"
            make_catalog(catalog)
            write_record(metadata, "api", DIGEST_A)
            with self.assertRaisesRegex(ValueError, "missing=.*frontend"):
                build_manifest(catalog, metadata, "example/parsevk", COMMIT)

    def test_invalid_digest_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            catalog = root / "catalog.yaml"
            metadata = root / "metadata"
            make_catalog(catalog)
            write_record(metadata, "api", "sha256:bad")
            write_record(metadata, "frontend", DIGEST_B)
            with self.assertRaisesRegex(ValueError, "invalid image digest"):
                build_manifest(catalog, metadata, "example/parsevk", COMMIT)

    def test_commit_mismatch_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            catalog = root / "catalog.yaml"
            metadata = root / "metadata"
            make_catalog(catalog)
            write_record(metadata, "api", DIGEST_A, "2" * 40)
            write_record(metadata, "frontend", DIGEST_B)
            with self.assertRaisesRegex(ValueError, "commit does not match"):
                build_manifest(catalog, metadata, "example/parsevk", COMMIT)


if __name__ == "__main__":
    unittest.main()

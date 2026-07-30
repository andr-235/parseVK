from __future__ import annotations

import argparse
import json
import re
from datetime import UTC, datetime
from pathlib import Path

from service_catalog_lib import Catalog, CatalogError

DIGEST_PATTERN = re.compile(r"^sha256:[0-9a-f]{64}$")
REQUIRED_FIELDS = {
    "service",
    "repository",
    "tag",
    "digest",
    "reference",
    "commit_sha",
}


def image_env_name(service: str) -> str:
    return f"{service.upper().replace('-', '_')}_IMAGE"


def load_records(directory: Path) -> dict[str, dict[str, str]]:
    records: dict[str, dict[str, str]] = {}
    for path in sorted(directory.glob("*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict) or set(raw) != REQUIRED_FIELDS:
            raise ValueError(f"{path.name}: invalid image metadata fields")
        if not all(isinstance(raw[field], str) and raw[field] for field in REQUIRED_FIELDS):
            raise ValueError(f"{path.name}: image metadata values must be strings")
        service = raw["service"]
        if service in records:
            raise ValueError(f"duplicate image metadata for service: {service}")
        if not DIGEST_PATTERN.fullmatch(raw["digest"]):
            raise ValueError(f"{path.name}: invalid image digest")
        if raw["reference"] != f'{raw["repository"]}@{raw["digest"]}':
            raise ValueError(f"{path.name}: image reference does not match digest")
        records[service] = raw
    return records


def build_manifest(
    catalog_path: Path,
    metadata_dir: Path,
    repository: str,
    commit_sha: str,
    created_at: str | None = None,
) -> dict[str, object]:
    catalog = Catalog.load(catalog_path)
    expected = tuple(service.name for service in catalog.selected("docker"))
    records = load_records(metadata_dir)
    missing = sorted(set(expected) - records.keys())
    unexpected = sorted(records.keys() - set(expected))
    if missing or unexpected:
        raise ValueError(
            f"image metadata coverage mismatch: missing={missing}, unexpected={unexpected}"
        )

    images: dict[str, dict[str, str]] = {}
    for service in expected:
        record = records[service]
        if record["commit_sha"] != commit_sha:
            raise ValueError(f"{service}: image metadata commit does not match release")
        images[service] = {
            "env": image_env_name(service),
            "repository": record["repository"],
            "tag": record["tag"],
            "digest": record["digest"],
            "reference": record["reference"],
        }

    timestamp = created_at or datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "schema_version": 1,
        "repository": repository,
        "commit_sha": commit_sha,
        "created_at": timestamp,
        "images": images,
    }


def write_release_files(manifest: dict[str, object], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "release.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    images = manifest["images"]
    if not isinstance(images, dict):
        raise ValueError("manifest images must be an object")
    env_lines = [f'RELEASE_COMMIT_SHA={manifest["commit_sha"]}']
    for service in sorted(images):
        image = images[service]
        if not isinstance(image, dict):
            raise ValueError(f"{service}: invalid manifest image entry")
        env_lines.append(f'{image["env"]}={image["reference"]}')
    (output_dir / "release.env").write_text("\n".join(env_lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a production image manifest")
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--metadata-dir", type=Path, required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--commit-sha", required=True)
    parser.add_argument("--created-at")
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    try:
        manifest = build_manifest(
            args.catalog,
            args.metadata_dir,
            args.repository,
            args.commit_sha,
            args.created_at,
        )
        write_release_files(manifest, args.output_dir)
    except (CatalogError, json.JSONDecodeError, OSError, ValueError) as exc:
        parser.error(str(exc))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Shared fixtures for service catalog tests."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from service_catalog_lib import Catalog, executable


def make_catalog(path: Path) -> Catalog:
    data = {
        "schema_version": 2,
        "global_change_paths": {
            "pytest": ["libs/py/common/"],
            "audit": ["libs/py/common/"],
            "docker": [".dockerignore", "libs/py/common/"],
            "deploy": [".dockerignore", "libs/py/common/"],
            "migration": [
                ".github/service-catalog.yaml",
                "docker-compose.yml",
                "libs/py/common/",
            ],
        },
        "services": {
            "api": {
                "kind": "python",
                "path": "services/api",
                "dockerfile": "services/api/Dockerfile",
                "change_paths": ["services/api/"],
                "pytest": True,
                "dependency_audit": True,
                "docker_scan": True,
                "compose_build": ["api", "api-migrate"],
                "migration": {
                    "database_url_env": "API_DATABASE_URL",
                    "compose_target": "api-migrate",
                },
            },
            "frontend": {
                "kind": "frontend",
                "path": "front",
                "dockerfile": "docker/frontend.Dockerfile",
                "change_paths": ["front/", "docker/frontend.Dockerfile"],
                "pytest": False,
                "dependency_audit": False,
                "docker_scan": True,
                "compose_build": ["frontend"],
                "migration": None,
            },
        },
    }
    path.write_text(json.dumps(data), encoding="utf-8")
    return Catalog.load(path)


def run_git(repo: Path, *args: str) -> str:
    result = subprocess.run(  # noqa: S603 - controlled git command in test
        [executable("git"), *args],
        cwd=repo,
        text=True,
        capture_output=True,
        check=True,
    )
    return result.stdout.strip()

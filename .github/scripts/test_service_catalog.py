from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("service_catalog.py")
spec = importlib.util.spec_from_file_location("service_catalog", MODULE_PATH)
assert spec and spec.loader
service_catalog = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = service_catalog
spec.loader.exec_module(service_catalog)

Catalog = service_catalog.Catalog
CatalogError = service_catalog.CatalogError
_deploy_targets = service_catalog._deploy_targets
_path_matches = service_catalog._path_matches
_service_matrix = service_catalog._service_matrix


def make_catalog(path: Path) -> Catalog:
    data = {
        "schema_version": 2,
        "global_change_paths": {
            "pytest": ["libs/py/common/"],
            "audit": ["libs/py/common/"],
            "docker": [".dockerignore", "libs/py/common/"],
            "deploy": [".dockerignore", "libs/py/common/"],
            "migration": ["libs/py/common/"],
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


class CatalogTests(unittest.TestCase):
    def test_service_specific_change_selects_one_service(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            selected = catalog.changed("pytest", ["services/api/app/main.py"])
            self.assertEqual([service.name for service in selected], ["api"])

    def test_migration_change_selects_db_service(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            selected = catalog.changed("migration", ["services/api/alembic/versions/001.py"])
            self.assertEqual([service.name for service in selected], ["api"])

    def test_global_python_change_selects_quality_and_migrations(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            self.assertEqual(
                [service.name for service in catalog.changed("pytest", ["libs/py/common/runtime.py"])],
                ["api"],
            )
            self.assertEqual(
                [service.name for service in catalog.changed("migration", ["libs/py/common/runtime.py"])],
                ["api"],
            )

    def test_docker_global_change_selects_every_image(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            selected = catalog.changed("docker", [".dockerignore"])
            self.assertEqual([service.name for service in selected], ["api", "frontend"])

    def test_file_change_path_requires_exact_match(self) -> None:
        self.assertTrue(_path_matches(".dockerignore", [".dockerignore"]))
        self.assertFalse(_path_matches(".dockerignore.backup", [".dockerignore"]))
        self.assertTrue(_path_matches("services/api/app.py", ["services/api/"]))

    def test_catalog_only_change_does_not_run_application_jobs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            for purpose in ("pytest", "docker", "deploy", "migration"):
                with self.subTest(purpose=purpose):
                    self.assertEqual(catalog.changed(purpose, [".github/service-catalog.yaml"]), ())

    def test_deploy_targets_are_flattened_without_duplicates(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            targets = _deploy_targets(catalog.services)
            self.assertEqual(targets, ["api", "api-migrate", "frontend"])

    def test_docker_matrix_contains_dockerfile_and_image(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            matrix = json.loads(_service_matrix(catalog.selected("docker"), "docker"))
            self.assertEqual(matrix["include"][0]["dockerfile"], "services/api/Dockerfile")
            self.assertEqual(matrix["include"][1]["image"], "parsevk-frontend:scan")

    def test_migration_matrix_contains_database_env(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            matrix = json.loads(_service_matrix(catalog.selected("migration"), "migration"))
            self.assertEqual(
                matrix,
                {
                    "include": [
                        {
                            "service": "api",
                            "database_url_env": "API_DATABASE_URL",
                        }
                    ]
                },
            )

    def test_invalid_migration_env_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory) / "base.yaml"
            make_catalog(base)
            data = json.loads(base.read_text(encoding="utf-8"))
            data["services"]["api"]["migration"]["database_url_env"] = "api_database_url"
            path = Path(directory) / "catalog.yaml"
            path.write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaisesRegex(CatalogError, "uppercase env name"):
                Catalog.load(path)

    def test_unknown_service_field_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory) / "base.yaml"
            make_catalog(base)
            data = json.loads(base.read_text(encoding="utf-8"))
            first = next(iter(data["services"].values()))
            first["surprise"] = True
            path = Path(directory) / "catalog.yaml"
            path.write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaisesRegex(CatalogError, "unknown fields"):
                Catalog.load(path)


if __name__ == "__main__":
    unittest.main()

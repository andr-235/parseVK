from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import service_catalog_git_tests
from service_catalog_lib import (
    Catalog,
    CatalogError,
    deploy_targets,
    path_matches,
    service_matrix,
)
from service_catalog_test_support import make_catalog


class CatalogTests(unittest.TestCase):
    def test_service_specific_change_selects_one_service(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            selected = catalog.changed("pytest", ["services/api/app/main.py"])
            self.assertEqual([service.name for service in selected], ["api"])

    def test_migration_change_selects_db_service(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            selected = catalog.changed(
                "migration", ["services/api/alembic/versions/001.py"]
            )
            self.assertEqual([service.name for service in selected], ["api"])

    def test_global_change_selects_quality_and_migrations(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            changed = ["libs/py/common/runtime.py"]
            self.assertEqual(
                [service.name for service in catalog.changed("pytest", changed)],
                ["api"],
            )
            self.assertEqual(
                [service.name for service in catalog.changed("migration", changed)],
                ["api"],
            )

    def test_docker_global_change_selects_every_image(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            selected = catalog.changed("docker", [".dockerignore"])
            self.assertEqual([service.name for service in selected], ["api", "frontend"])

    def test_file_path_requires_exact_match(self) -> None:
        self.assertTrue(path_matches(".dockerignore", [".dockerignore"]))
        self.assertFalse(path_matches(".dockerignore.backup", [".dockerignore"]))
        self.assertTrue(path_matches("services/api/app.py", ["services/api/"]))

    def test_catalog_only_change_does_not_run_application_jobs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            for purpose in ("pytest", "docker", "deploy", "migration"):
                with self.subTest(purpose=purpose):
                    self.assertEqual(
                        catalog.changed(purpose, [".github/service-catalog.yaml"]), ()
                    )

    def test_deploy_targets_are_flattened(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            self.assertEqual(
                deploy_targets(catalog.services),
                ["api", "api-migrate", "frontend"],
            )

    def test_docker_matrix_contains_docker_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            matrix = json.loads(service_matrix(catalog.selected("docker"), "docker"))
            self.assertEqual(
                matrix["include"][0]["dockerfile"], "services/api/Dockerfile"
            )
            self.assertEqual(matrix["include"][1]["image"], "parsevk-frontend:scan")

    def test_migration_matrix_contains_database_env(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            matrix = json.loads(
                service_matrix(catalog.selected("migration"), "migration")
            )
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
            data["services"]["api"]["migration"]["database_url_env"] = "bad_name"
            path = Path(directory) / "catalog.yaml"
            path.write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaisesRegex(CatalogError, "uppercase env name"):
                Catalog.load(path)

    def test_unknown_service_field_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory) / "base.yaml"
            make_catalog(base)
            data = json.loads(base.read_text(encoding="utf-8"))
            next(iter(data["services"].values()))["surprise"] = True
            path = Path(directory) / "catalog.yaml"
            path.write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaisesRegex(CatalogError, "unknown fields"):
                Catalog.load(path)


def load_tests(
    loader: unittest.TestLoader,
    tests: unittest.TestSuite,
    _pattern: str | None,
) -> unittest.TestSuite:
    tests.addTests(loader.loadTestsFromModule(service_catalog_git_tests))
    return tests


if __name__ == "__main__":
    unittest.main()

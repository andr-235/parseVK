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
_service_matrix = service_catalog._service_matrix


def make_catalog(path: Path) -> Catalog:
    data = {
        "schema_version": 1,
        "global_change_paths": {
            "pytest": ["libs/py/common/"],
            "audit": ["libs/py/common/"],
            "docker": [".dockerignore", "libs/py/common/"],
            "deploy": [".dockerignore", "libs/py/common/"],
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

    def test_global_python_change_selects_all_python_services_only(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            selected = catalog.changed("pytest", ["libs/py/common/runtime.py"])
            self.assertEqual([service.name for service in selected], ["api"])

    def test_docker_global_change_selects_every_image(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            selected = catalog.changed("docker", [".dockerignore"])
            self.assertEqual([service.name for service in selected], ["api", "frontend"])

    def test_catalog_only_change_does_not_run_application_jobs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            for purpose in ("pytest", "docker", "deploy"):
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

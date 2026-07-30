from __future__ import annotations

import argparse
import tempfile
import unittest
from pathlib import Path

from service_catalog import resolve_services
from service_catalog_lib import git_changed_files
from service_catalog_test_support import make_catalog, run_git


class CatalogGitChangeTests(unittest.TestCase):
    def test_git_diff_ignores_base_only_commits(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            run_git(repo, "init", "-b", "main")
            run_git(repo, "config", "user.email", "ci@example.test")
            run_git(repo, "config", "user.name", "CI Test")
            (repo / "shared.txt").write_text("base\n", encoding="utf-8")
            run_git(repo, "add", "shared.txt")
            run_git(repo, "commit", "-m", "base")
            run_git(repo, "switch", "-c", "feature")
            (repo / "feature.txt").write_text("feature\n", encoding="utf-8")
            run_git(repo, "add", "feature.txt")
            run_git(repo, "commit", "-m", "feature")
            feature_sha = run_git(repo, "rev-parse", "HEAD")
            run_git(repo, "switch", "main")
            (repo / "base-only.txt").write_text("release\n", encoding="utf-8")
            run_git(repo, "add", "base-only.txt")
            run_git(repo, "commit", "-m", "base advanced")
            base_sha = run_git(repo, "rev-parse", "HEAD")
            self.assertEqual(
                git_changed_files(repo, base_sha, feature_sha),
                ["feature.txt"],
            )

    def test_missing_base_with_head_selects_full_matrix(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            catalog = make_catalog(Path(directory) / "catalog.yaml")
            args = argparse.Namespace(
                all=False,
                changed_file=[],
                base="",
                head="1" * 40,
                purpose="pytest",
                repo_root=Path(directory),
            )
            self.assertEqual(
                [service.name for service in resolve_services(args, catalog)],
                ["api"],
            )

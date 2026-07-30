from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from alembic_graph import validate_versions_dir


def write_revision(
    directory: Path,
    filename: str,
    revision: str,
    down_revision: str | tuple[str, ...] | list[str] | None,
) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    (directory / filename).write_text(
        "\n".join(
            [
                f'revision = "{revision}"',
                f"down_revision = {down_revision!r}",
                "",
                "def upgrade() -> None:",
                "    pass",
                "",
                "def downgrade() -> None:",
                "    pass",
                "",
            ]
        ),
        encoding="utf-8",
    )


class AlembicGraphTests(unittest.TestCase):
    def test_valid_linear_graph(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            versions = Path(directory)
            write_revision(versions, "001.py", "001", None)
            write_revision(versions, "002.py", "002", "001")
            errors, head = validate_versions_dir("demo", versions)
            self.assertEqual(errors, [])
            self.assertEqual(head, "002")

    def test_missing_parent_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            versions = Path(directory)
            write_revision(versions, "002.py", "002", "missing")
            errors, _ = validate_versions_dir("demo", versions)
            self.assertTrue(any("missing parent revisions" in error for error in errors))

    def test_empty_parent_string_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            versions = Path(directory)
            write_revision(versions, "001.py", "001", "")
            errors, head = validate_versions_dir("demo", versions)
            self.assertTrue(any("non-empty string" in error for error in errors))
            self.assertIsNone(head)

    def test_empty_parent_sequence_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            versions = Path(directory)
            write_revision(versions, "001.py", "001", [])
            errors, head = validate_versions_dir("demo", versions)
            self.assertTrue(any("non-empty string sequence" in error for error in errors))
            self.assertIsNone(head)

    def test_multiple_bases_are_allowed_when_they_merge(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            versions = Path(directory)
            write_revision(versions, "001.py", "001", None)
            write_revision(versions, "other.py", "other", None)
            write_revision(versions, "merge.py", "merge", ("001", "other"))
            errors, head = validate_versions_dir("demo", versions)
            self.assertEqual(errors, [])
            self.assertEqual(head, "merge")

    def test_unmerged_bases_are_rejected_as_multiple_heads(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            versions = Path(directory)
            write_revision(versions, "001.py", "001", None)
            write_revision(versions, "other.py", "other", None)
            errors, head = validate_versions_dir("demo", versions)
            self.assertTrue(any("expected exactly one head" in error for error in errors))
            self.assertIsNone(head)

    def test_cycle_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            versions = Path(directory)
            write_revision(versions, "001.py", "001", "002")
            write_revision(versions, "002.py", "002", "001")
            errors, _ = validate_versions_dir("demo", versions)
            self.assertTrue(any("revision cycle detected" in error for error in errors))

    def test_empty_versions_directory_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            errors, head = validate_versions_dir("demo", Path(directory))
            self.assertEqual(errors, ["demo: no migration revisions found"])
            self.assertIsNone(head)


if __name__ == "__main__":
    unittest.main()

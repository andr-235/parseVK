"""CLI for contract generation and drift checking."""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

from parsevk_contracts.generation import generate_all
from parsevk_contracts.vk.commands import CATALOG


def _tree_files(root: Path) -> set[Path]:
    """Collect all file paths under root, relative to root."""
    return {
        p.relative_to(root)
        for p in root.rglob("*")
        if p.is_file()
    }


def check(output_dir: str = "generated") -> int:
    """Compare committed generated/ with a fresh generation.

    Returns 0 if identical, 1 if drift detected.
    """
    committed_dir = Path(output_dir)
    if not committed_dir.exists():
        print(f"ERROR: {output_dir} does not exist", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory() as tmp:
        fresh_dir = Path(tmp)
        generate_all(CATALOG, output_dir=str(fresh_dir))

        committed_files = _tree_files(committed_dir)
        fresh_files = _tree_files(fresh_dir)

        missing = fresh_files - committed_files
        stale = committed_files - fresh_files
        changed = 0

        if stale:
            print("STALE files (in committed but not in fresh generation):")
            for p in sorted(stale):
                print(f"  - {p}")
            changed += 1

        if missing:
            print("MISSING files (in fresh generation but not in committed):")
            for p in sorted(missing):
                print(f"  - {p}")
            changed += 1

        common = fresh_files & committed_files
        for rel_path in sorted(common):
            committed_content = (committed_dir / rel_path).read_bytes()
            fresh_content = (fresh_dir / rel_path).read_bytes()
            if committed_content != fresh_content:
                print(f"DRIFT: {rel_path} differs")
                changed += 1

        if changed:
            print(f"\nDrift detected in {changed} file(s)")
            return 1

        print("All generated artifacts are up to date.")
        return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="parseVK contract generation CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    check_parser = sub.add_parser("check", help="Check generated artifacts for drift")
    check_parser.add_argument(
        "--output-dir",
        default="generated",
        help="Output directory (default: generated)",
    )

    generate_parser = sub.add_parser("generate", help="Generate all artifacts")
    generate_parser.add_argument(
        "--output-dir",
        default="generated",
        help="Output directory (default: generated)",
    )

    args = parser.parse_args()

    if args.command == "check":
        sys.exit(check(args.output_dir))

    if args.command == "generate":
        generate_all(CATALOG, output_dir=args.output_dir)
        print(f"Generated artifacts in {args.output_dir}/")
        sys.exit(0)


if __name__ == "__main__":
    main()

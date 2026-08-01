"""CLI for contract generation, drift checking, and compatibility validation."""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

from parsevk_contracts.catalog import ContractCatalog
from parsevk_contracts.compatibility import CompatibilityCheckError, check_compatibility
from parsevk_contracts.generation import generate_all
from parsevk_contracts.registry_validation import validate_registry
from parsevk_contracts.sources import SOURCES_CATALOG
from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG

# Single merged catalog across all registered domains.
CATALOG = ContractCatalog.from_contracts(VK_CATALOG.contracts + SOURCES_CATALOG.contracts)


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


def run_compatibility(args: argparse.Namespace) -> int:
    """Run compatibility check between baseline and current generated artifacts."""
    baseline_dir = Path(args.baseline)
    current_dir = Path(args.current)

    if not baseline_dir.exists():
        print(f"ERROR: baseline directory does not exist: {baseline_dir}", file=sys.stderr)
        return 2
    if not current_dir.exists():
        print(f"ERROR: current directory does not exist: {current_dir}", file=sys.stderr)
        return 2

    try:
        violations = check_compatibility(baseline_dir, current_dir)
    except CompatibilityCheckError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    if not violations:
        print("All contracts are compatible with baseline.")
        return 0

    for v in violations:
        ident = f"{v.message_type} v{v.schema_version}"
        print(f"VIOLATION [{v.code}] {ident}", file=sys.stderr)
        if v.field:
            print(f"  Field: {v.field}", file=sys.stderr)
        print(f"  Detail: {v.detail}", file=sys.stderr)
        print(file=sys.stderr)

    count = len(violations)
    suffix = "s" if count != 1 else ""
    print(f"FAIL: {count} compatibility violation{suffix} found.", file=sys.stderr)
    return 1


def run_validate_registry(args: argparse.Namespace) -> int:
    """Validate registry metadata completeness."""
    try:
        violations = validate_registry(CATALOG)
    except Exception as exc:
        print(f"ERROR: registry validation failed: {exc}", file=sys.stderr)
        return 2

    if not violations:
        print("Registry metadata is valid.")
        return 0

    for v in violations:
        ident = f"{v.message_type} v{v.schema_version}" if v.schema_version else v.message_type
        print(f"VIOLATION [{v.code}] {ident}", file=sys.stderr)
        print(f"  Field: {v.field}", file=sys.stderr)
        print(f"  Detail: {v.detail}", file=sys.stderr)
        print(file=sys.stderr)

    count = len(violations)
    suffix = "s" if count != 1 else ""
    print(f"FAIL: {count} registry violation{suffix} found.", file=sys.stderr)
    return 1


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

    compat_parser = sub.add_parser(
        "compatibility",
        help="Check contract compatibility against a baseline",
    )
    compat_parser.add_argument(
        "--baseline",
        required=True,
        help="Path to baseline generated/ directory (e.g. from main branch)",
    )
    compat_parser.add_argument(
        "--current",
        default="generated",
        help="Path to current generated/ directory (default: generated)",
    )

    sub.add_parser(
        "validate-registry",
        help="Validate registry metadata completeness",
    )

    args = parser.parse_args()

    if args.command == "check":
        sys.exit(check(args.output_dir))

    if args.command == "generate":
        generate_all(CATALOG, output_dir=args.output_dir)
        print(f"Generated artifacts in {args.output_dir}/")
        sys.exit(0)

    if args.command == "compatibility":
        sys.exit(run_compatibility(args))

    if args.command == "validate-registry":
        sys.exit(run_validate_registry(args))


if __name__ == "__main__":
    main()

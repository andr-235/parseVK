"""CLI for contract generation and drift checking."""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

from parsevk_contracts.catalog import ContractCatalog
from parsevk_contracts.generation import generate_all
from parsevk_contracts.registry_validation import validate_registry
from parsevk_contracts.sources import SOURCES_CATALOG
from parsevk_contracts.vk.commands import CATALOG as VK_CATALOG

CATALOG = ContractCatalog.from_contracts(
    VK_CATALOG.contracts + SOURCES_CATALOG.contracts
)


def _tree_files(root: Path) -> set[Path]:
    return {
        path.relative_to(root)
        for path in root.rglob("*")
        if path.is_file()
    }


def check(output_dir: str = "generated") -> int:
    committed_dir = Path(output_dir)
    if not committed_dir.exists():
        print(f"ERROR: {output_dir} does not exist", file=sys.stderr)
        return 1
    with tempfile.TemporaryDirectory() as tmp:
        fresh_dir = Path(tmp)
        generate_all(CATALOG, output_dir=fresh_dir)
        committed_files = _tree_files(committed_dir)
        fresh_files = _tree_files(fresh_dir)
        problems = 0
        for path in sorted(committed_files - fresh_files):
            print(f"STALE: {path}")
            problems += 1
        for path in sorted(fresh_files - committed_files):
            print(f"MISSING: {path}")
            problems += 1
        for path in sorted(fresh_files & committed_files):
            if (committed_dir / path).read_bytes() != (fresh_dir / path).read_bytes():
                print(f"DRIFT: {path}")
                problems += 1
        if problems:
            print(f"Drift detected in {problems} artifact(s)")
            return 1
    print("All generated artifacts are up to date.")
    return 0


def run_validate_registry() -> int:
    try:
        violations = validate_registry(CATALOG)
    except Exception as exc:
        print(f"ERROR: registry validation failed: {exc}", file=sys.stderr)
        return 2
    if not violations:
        print("Registry metadata is valid.")
        return 0
    for violation in violations:
        print(
            f"VIOLATION [{violation.code}] {violation.message_type}",
            file=sys.stderr,
        )
        print(f"  Field: {violation.field}", file=sys.stderr)
        print(f"  Detail: {violation.detail}", file=sys.stderr)
    print(f"FAIL: {len(violations)} registry violation(s)", file=sys.stderr)
    return 1


def main() -> None:
    parser = argparse.ArgumentParser(description="parseVK contract generation CLI")
    sub = parser.add_subparsers(dest="command", required=True)
    check_parser = sub.add_parser("check")
    check_parser.add_argument("--output-dir", default="generated")
    generate_parser = sub.add_parser("generate")
    generate_parser.add_argument("--output-dir", default="generated")
    sub.add_parser("validate-registry")
    args = parser.parse_args()
    if args.command == "check":
        raise SystemExit(check(args.output_dir))
    if args.command == "generate":
        generate_all(CATALOG, output_dir=args.output_dir)
        print(f"Generated artifacts in {args.output_dir}/")
        raise SystemExit(0)
    raise SystemExit(run_validate_registry())


if __name__ == "__main__":
    main()

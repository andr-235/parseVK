#!/usr/bin/env python3
"""Plan and aggregate commit-scoped parseVK AI reviews."""

from __future__ import annotations

import argparse
import json
from collections.abc import Sequence
from pathlib import Path

from ai_review_batch_lib import (
    build_batch,
    build_plan,
    matrix_json,
    write_batch,
    write_plan,
)


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="command", required=True)

    plan = commands.add_parser("plan")
    plan.add_argument("--action", required=True)
    plan.add_argument("--base", required=True)
    plan.add_argument("--before", default="")
    plan.add_argument("--head", required=True)
    plan.add_argument("--repo", type=Path, default=Path("."))
    plan.add_argument("--output", type=Path, required=True)
    plan.add_argument("--github-output", type=Path)

    aggregate = commands.add_parser("aggregate")
    aggregate.add_argument("--plan", type=Path, required=True)
    aggregate.add_argument("--results-dir", type=Path, required=True)
    aggregate.add_argument("--output", type=Path, required=True)
    return root


def main(argv: Sequence[str] | None = None) -> int:
    args = parser().parse_args(argv)
    if args.command == "plan":
        value = build_plan(
            action=args.action,
            base_sha=args.base,
            before_sha=args.before,
            head_sha=args.head,
            cwd=args.repo.resolve(),
        )
        write_plan(args.output, value)
        if args.github_output:
            with args.github_output.open("a", encoding="utf-8") as output:
                output.write(f"matrix={matrix_json(value)}\n")
                output.write(f"count={len(value.get('units', []))}\n")
                output.write(f"status={value['status']}\n")
        print(
            f"Commit review plan: {value['status']}; "
            f"commits={value.get('commit_count', 0)}"
        )
        return 0

    plan_value = json.loads(args.plan.read_text(encoding="utf-8"))
    batch = build_batch(plan_value, args.results_dir)
    write_batch(args.output, batch)
    print(
        f"Commit review batch: {batch['verdict']}; "
        f"commits={len(batch['commit_results'])}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

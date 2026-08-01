#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path


SHA_RE = re.compile(r"^[0-9a-f]{40}$")


def optional_sha(value: str) -> str | None:
    if not value:
        return None
    if not SHA_RE.fullmatch(value):
        raise argparse.ArgumentTypeError("commit SHA must contain 40 lowercase hexadecimal characters")
    return value


def load_smoke(path: Path) -> dict[str, object] | None:
    if not path.exists():
        return None
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or not isinstance(payload.get("success"), bool):
        raise ValueError("invalid smoke report")
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Build machine-readable production deployment evidence")
    parser.add_argument("--release-sha", required=True, type=optional_sha)
    parser.add_argument("--active-sha", required=True, type=optional_sha)
    parser.add_argument("--previous-sha", default="", type=optional_sha)
    parser.add_argument("--deployment-status", choices=("success", "failure"), required=True)
    parser.add_argument("--skipped", choices=("true", "false"), required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--run-attempt", required=True)
    parser.add_argument("--smoke-report", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    smoke = load_smoke(args.smoke_report)
    evidence = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "release_sha": args.release_sha,
        "active_sha": args.active_sha,
        "previous_release_sha": args.previous_sha,
        "deployment_status": args.deployment_status,
        "skipped": args.skipped == "true",
        "release_matches_active": args.release_sha == args.active_sha,
        "smoke": smoke,
        "github": {
            "repository": args.repository,
            "run_id": args.run_id,
            "run_attempt": args.run_attempt,
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(evidence, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

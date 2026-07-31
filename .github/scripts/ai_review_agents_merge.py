#!/usr/bin/env python3
"""Merge trusted AGENTS.md findings into any reviewer result."""

from __future__ import annotations

import argparse
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

BLOCKING = {"blocker", "major"}


class MergeError(RuntimeError):
    pass


def load_object(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise MergeError(f"{path} must contain a JSON object")
    return value


def is_size_finding(value: Mapping[str, Any]) -> bool:
    text = " ".join(str(value.get(key, "")) for key in ("scenario", "impact", "fix")).lower()
    return ("строк" in text or "lines" in text) and ("файл" in text or "file" in text)


def merge_result(result: dict[str, Any], rules: Mapping[str, Any]) -> dict[str, Any]:
    if str(result.get("head_sha")) != str(rules.get("head_sha")):
        raise MergeError("review result and AGENTS findings refer to different commits")
    deterministic = rules.get("findings")
    if not isinstance(deterministic, list):
        raise MergeError("AGENTS findings must be an array")
    if not deterministic:
        return result

    files = {
        str(item.get("file"))
        for item in deterministic
        if isinstance(item, Mapping) and item.get("file")
    }
    model = result.get("findings")
    if not isinstance(model, list):
        model = []
    model = [
        item
        for item in model
        if not (
            isinstance(item, Mapping)
            and str(item.get("file")) in files
            and is_size_finding(item)
        )
    ]
    findings = deterministic + model
    result.update(
        {
            "status": "completed",
            "reason": "agents-rules-enforced",
            "summary": (
                f"Обязательные правила AGENTS.md: {len(deterministic)}; "
                f"всего замечаний: {len(findings)}."
            ),
            "findings": findings,
            "verdict": "changes-required",
            "reaction": "-1",
            "blocking_count": sum(
                isinstance(item, Mapping) and item.get("severity") in BLOCKING
                for item in findings
            ),
        }
    )
    return result


def merge_files(result_path: Path, findings_path: Path) -> int:
    if not findings_path.is_file():
        return 0
    result = merge_result(load_object(result_path), load_object(findings_path))
    result_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Merged AGENTS.md findings: {len(result.get('findings', []))}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--result", type=Path, required=True)
    parser.add_argument("--findings", type=Path, required=True)
    args = parser.parse_args()
    return merge_files(args.result, args.findings)


if __name__ == "__main__":
    raise SystemExit(main())

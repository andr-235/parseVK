from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REACTIONS = {
    "approved": "+1",
    "changes-required": "-1",
    "findings": "confused",
    "review-required": "confused",
    "unavailable": "confused",
}


def _fallback(commit_sha: str, reason: str) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "status": "technical-error",
        "reason": reason,
        "head_sha": commit_sha,
        "summary": "Ревью этого commit завершилось технической ошибкой.",
        "findings": [],
        "dropped_findings": 0,
        "verdict": "unavailable",
        "reaction": "confused",
        "blocking_count": 0,
    }


def _load_result(path: Path, expected_head: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return _fallback(expected_head, "commit-result-missing")
    if not isinstance(value, dict) or value.get("head_sha") != expected_head:
        return _fallback(expected_head, "commit-result-head-mismatch")
    return value


def _aggregate_verdict(results: list[dict[str, Any]]) -> str:
    verdicts = {str(item.get("verdict")) for item in results}
    if "changes-required" in verdicts:
        return "changes-required"
    if "review-required" in verdicts:
        return "review-required"
    if "findings" in verdicts:
        return "findings"
    if "unavailable" in verdicts:
        return "unavailable"
    return "approved"


def build_batch(plan: dict[str, Any], results_dir: Path) -> dict[str, Any]:
    run_head = str(plan["run_head_sha"])
    if plan.get("status") == "oversized":
        verdict = "review-required"
        results: list[dict[str, Any]] = []
        summary = (
            f"В push обнаружено {plan.get('commit_count', 0)} commits. "
            "Лимит автоматического commit-review превышен."
        )
    else:
        results = [
            _load_result(results_dir / f"{unit['head_sha']}.json", unit["head_sha"])
            for unit in plan.get("units", [])
        ]
        verdict = _aggregate_verdict(results)
        counts: dict[str, int] = {}
        for item in results:
            key = str(item.get("verdict"))
            counts[key] = counts.get(key, 0) + 1
        summary = (
            f"Проверено commits: {len(results)}. "
            f"С замечаниями: {counts.get('findings', 0) + counts.get('changes-required', 0)}. "
            f"Технических ошибок: {counts.get('unavailable', 0)}."
        )
    blocking = sum(int(item.get("blocking_count") or 0) for item in results)
    dropped = sum(int(item.get("dropped_findings") or 0) for item in results)
    return {
        "schema_version": 2,
        "status": "completed" if verdict != "unavailable" else "partial",
        "reason": "commit-review-batch",
        "head_sha": run_head,
        "summary": summary,
        "findings": [],
        "dropped_findings": dropped,
        "verdict": verdict,
        "reaction": REACTIONS[verdict],
        "blocking_count": blocking,
        "commit_results": results,
    }


def write_batch(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

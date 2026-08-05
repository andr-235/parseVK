#!/usr/bin/env python3
"""Validate event-scoped concurrency for the Security workflow."""

from __future__ import annotations

import sys
from pathlib import Path

EXPECTED_GROUP = (
    "group: security-${{ github.workflow }}-"
    "${{ github.event.pull_request.number || github.ref }}"
)
EXPECTED_CANCEL = (
    "cancel-in-progress: ${{ github.event_name == 'pull_request' }}"
)


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    workflow = root / ".github/workflows/security.yml"
    text = workflow.read_text(encoding="utf-8")
    errors: list[str] = []

    if "\nconcurrency:\n" not in text:
        errors.append("Security workflow has no top-level concurrency block")
    if EXPECTED_GROUP not in text:
        errors.append("Security concurrency group is not scoped to PR number/ref")
    if EXPECTED_CANCEL not in text:
        errors.append("Security cancellation is not limited to pull_request events")
    if "cancel-in-progress: true" in text:
        errors.append("Security workflow must not cancel main, scheduled or manual runs")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    print("Security workflow concurrency is event-safe")
    return 0


if __name__ == "__main__":
    sys.exit(main())

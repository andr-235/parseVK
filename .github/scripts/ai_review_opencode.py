#!/usr/bin/env python3
"""Bounded OpenCode execution with one technical retry."""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

try:
    from ai_review_core import (
        ReviewError,
        extract_json_object,
        extract_text_events,
        validate_model_result,
    )
except ImportError:
    from ai_review import (  # type: ignore[no-redef]
        ReviewError,
        extract_json_object,
        extract_text_events,
        validate_model_result,
    )

PRIMARY_TIMEOUT, RETRY_TIMEOUT = 180.0, 120.0
HEAD_RE = re.compile(r"Проверяемый HEAD:\s*([0-9a-fA-F]{40})")


def context(arguments: list[str], prompt: bytes) -> tuple[str, Path, str]:
    try:
        diff = Path(arguments[arguments.index("--file") + 1])
    except (ValueError, IndexError) as error:
        raise ReviewError("OpenCode arguments do not contain --file") from error
    match = re.fullmatch(r"review-(\d+)\.diff", diff.name)
    head = HEAD_RE.search(prompt.decode("utf-8", errors="replace"))
    if not match or not head:
        raise ReviewError("cannot resolve review chunk or expected HEAD")
    return match.group(1), diff.parent, head.group(1).lower()


def timeouts(directory: Path) -> tuple[float, float]:
    scope = json.loads((directory / "scope.json").read_text(encoding="utf-8"))
    count = max(1, len(scope.get("chunks", ())))
    primary = float(os.environ.get("AI_REVIEW_PRIMARY_TIMEOUT", PRIMARY_TIMEOUT))
    retry = float(os.environ.get("AI_REVIEW_RETRY_TIMEOUT", RETRY_TIMEOUT))
    return primary / count, retry / count


def call(binary: Path, arguments: list[str], prompt: bytes, seconds: float):
    started = time.monotonic()
    completed = subprocess.run(  # noqa: S603 -- fixed timeout executable
        [
            "/usr/bin/timeout",
            "--signal=TERM",
            "--kill-after=15s",
            f"{seconds}s",
            str(binary),
            *arguments,
        ],
        input=prompt,
        capture_output=True,
        check=False,
    )
    elapsed = round((time.monotonic() - started) * 1000)
    return completed.returncode, completed.stdout, completed.stderr, elapsed


def result_reason(events: Path, head: str, code: int) -> tuple[int, str]:
    if code == 124:
        return code, "timeout"
    if code:
        return code, f"exit-{code}"
    try:
        text = extract_text_events(events)
        status, summary, _ = validate_model_result(extract_json_object(text), head)
    except ReviewError as error:
        return 65, str(error)
    if status == "technical-error":
        return 69, f"model-technical-error: {summary}"
    return 0, "completed"


def write_summary(suffix: str, records: list[dict]) -> None:
    destination = os.environ.get("GITHUB_STEP_SUMMARY")
    if not destination:
        return
    lines = [
        f"### AI review chunk {suffix}",
        "",
        "| Попытка | Бюджет | Время | Результат |",
        "|---:|---:|---:|---|",
    ]
    for item in records:
        lines.append(
            f"| {item['attempt']} | {item['timeout']} с | "
            f"{item['elapsed_ms'] / 1000:.1f} с | {item['reason']} |"
        )
    with Path(destination).open("a", encoding="utf-8") as output:
        output.write("\n".join(lines) + "\n\n")


def run(arguments: list[str], prompt: bytes) -> int:
    suffix, directory, head = context(arguments, prompt)
    binary = Path(
        os.environ.get(
            "AI_REVIEW_OPENCODE_BIN",
            str(Path.home() / ".opencode/bin/opencode"),
        )
    )
    records: list[dict] = []
    for number, seconds in enumerate(timeouts(directory), start=1):
        code, stdout, stderr, elapsed = call(binary, arguments, prompt, seconds)
        diagnostic = directory / f"opencode-attempt-{suffix}-{number}.stdout.jsonl"
        diagnostic.write_bytes(stdout)
        (directory / f"opencode-{suffix}-attempt-{number}.stderr").write_bytes(stderr)
        code, reason = result_reason(diagnostic, head, code)
        records.append(
            {
                "attempt": number,
                "timeout": seconds,
                "elapsed_ms": elapsed,
                "reason": reason.replace("|", "/")[:180],
            }
        )
        last = (code, stdout, stderr)
        if code == 0:
            break

    write_summary(suffix, records)
    sys.stdout.buffer.write(last[1])
    sys.stderr.buffer.write(last[2])
    for record in records:
        print(f"AI_REVIEW_ATTEMPT {json.dumps(record, ensure_ascii=False)}", file=sys.stderr)
    return last[0]


def main() -> int:
    try:
        return run(sys.argv[1:], sys.stdin.buffer.read())
    except (OSError, ReviewError, ValueError, json.JSONDecodeError) as error:
        print(f"ai-review-opencode error: {error}", file=sys.stderr)
        return 70


if __name__ == "__main__":
    raise SystemExit(main())

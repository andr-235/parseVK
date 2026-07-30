from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any

MAX_FINDINGS = 20
VALID_SEVERITIES = {"blocker", "major", "minor"}
VALID_VERDICTS = {
    "approved",
    "changes-required",
    "findings",
    "review-required",
    "unavailable",
}
SHA_RE = re.compile(r"^[0-9a-f]{40}$")


class PublishError(RuntimeError):
    """Expected inline publisher failure."""


def require_text(value: Any, name: str, *, limit: int = 4000) -> str:
    if not isinstance(value, str) or not value.strip():
        raise PublishError(f"{name} must be a non-empty string")
    text = value.strip()
    if len(text) > limit:
        raise PublishError(f"{name} exceeds {limit} characters")
    return text


def normalize_path(value: Any) -> str:
    text = require_text(value, "finding.file", limit=500).replace("\\", "/")
    while text.startswith("./"):
        text = text[2:]
    path = PurePosixPath(text)
    if path.is_absolute() or ".." in path.parts:
        raise PublishError(f"invalid repository path: {text!r}")
    return path.as_posix()


@dataclass(frozen=True)
class Finding:
    severity: str
    file: str
    line: int | None
    scenario: str
    impact: str
    fix: str
    confidence: float

    @classmethod
    def from_value(cls, value: Any) -> Finding:
        if not isinstance(value, dict):
            raise PublishError("every finding must be an object")
        severity = value.get("severity")
        if severity not in VALID_SEVERITIES:
            raise PublishError(f"unsupported severity: {severity!r}")
        line = value.get("line")
        if line is not None and (
            not isinstance(line, int) or isinstance(line, bool) or line < 1
        ):
            raise PublishError("finding.line must be null or a positive integer")
        confidence = value.get("confidence")
        if not isinstance(confidence, (int, float)) or isinstance(confidence, bool):
            raise PublishError("finding.confidence must be numeric")
        confidence = float(confidence)
        if not 0 <= confidence <= 1:
            raise PublishError("finding.confidence must be between 0 and 1")
        return cls(
            severity=severity,
            file=normalize_path(value.get("file")),
            line=line,
            scenario=require_text(value.get("scenario"), "finding.scenario"),
            impact=require_text(value.get("impact"), "finding.impact"),
            fix=require_text(value.get("fix"), "finding.fix"),
            confidence=confidence,
        )


@dataclass(frozen=True)
class ReviewResult:
    head_sha: str
    status: str
    reason: str
    summary: str
    verdict: str
    findings: tuple[Finding, ...]
    blocking_count: int

    @classmethod
    def from_value(cls, value: Any) -> ReviewResult:
        if not isinstance(value, dict):
            raise PublishError("review result must be an object")
        head_sha = value.get("head_sha")
        if not isinstance(head_sha, str) or SHA_RE.fullmatch(head_sha) is None:
            raise PublishError("result.head_sha must be a 40-character SHA")
        verdict = value.get("verdict")
        if verdict not in VALID_VERDICTS:
            raise PublishError(f"unsupported verdict: {verdict!r}")
        raw_findings = value.get("findings")
        if not isinstance(raw_findings, list) or len(raw_findings) > MAX_FINDINGS:
            raise PublishError(f"result.findings must contain at most {MAX_FINDINGS} items")
        findings = tuple(Finding.from_value(item) for item in raw_findings)
        blocking_count = value.get("blocking_count", 0)
        if not isinstance(blocking_count, int) or isinstance(blocking_count, bool):
            raise PublishError("result.blocking_count must be an integer")
        return cls(
            head_sha=head_sha,
            status=require_text(value.get("status"), "result.status", limit=80),
            reason=require_text(value.get("reason"), "result.reason", limit=160),
            summary=require_text(value.get("summary"), "result.summary", limit=1000),
            verdict=verdict,
            findings=findings,
            blocking_count=blocking_count,
        )


def load_result(path: Path) -> ReviewResult:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise PublishError(f"cannot read review result: {error}") from error
    return ReviewResult.from_value(value)

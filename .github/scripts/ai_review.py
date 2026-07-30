#!/usr/bin/env python3
"""Deterministic support code for the parseVK AI review workflow.

The module intentionally uses only the Python standard library so it can run on a
stock GitHub-hosted runner.  OpenCode performs only the analysis.  This module
owns scope selection, JSON parsing, diff validation, sanitisation and GitHub
publication.
"""

from __future__ import annotations

import argparse
import dataclasses
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path, PurePosixPath
from typing import Any, Iterable, Mapping, Sequence

SCHEMA_VERSION = 1
MAX_CHUNK_FILES = 20
MAX_CHUNK_CHANGED_LINES = 2000
MAX_REVIEW_CHUNKS = 4
MAX_REVIEW_FILES = MAX_CHUNK_FILES * MAX_REVIEW_CHUNKS
MAX_CHANGED_LINES = MAX_CHUNK_CHANGED_LINES * MAX_REVIEW_CHUNKS
MAX_FINDINGS = 20
CONTEXT_RADIUS = 3

EXCLUDED_EXACT = {".github/workflows/ai-code-review.yml"}
EXCLUDED_PREFIXES = ("docs/", ".github/ai-review/", ".github/scripts/ai_review")
EXCLUDED_SUFFIXES = (
    ".md",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".ico",
    ".pdf",
)
FILE_LEVEL_SUFFIXES = (".yml", ".yaml", ".json", ".toml", ".sql", ".prisma")
FILE_LEVEL_PARTS = ("migration", "migrations", "schema")

SEVERITY_THRESHOLDS = {"blocker": 0.90, "major": 0.85, "minor": 0.90}
BLOCKING_SEVERITIES = {"blocker", "major"}

REVIEW_COMMENT_MARKERS = (
    "<!-- ai-review:canonical -->",
    "<!-- ai-review-result:",
    "[github run](",
)
ISSUE_MARKER_TEMPLATE = "<!-- ai-review:pr={pr_number} -->"


class ReviewError(RuntimeError):
    """Expected reviewer failure that should become review-unavailable."""


@dataclasses.dataclass(frozen=True)
class Finding:
    severity: str
    file: str
    line: int | None
    scenario: str
    impact: str
    fix: str
    confidence: float

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any]) -> "Finding":
        required = {"severity", "file", "line", "scenario", "impact", "fix", "confidence"}
        missing = required.difference(value)
        if missing:
            raise ReviewError(f"finding is missing fields: {', '.join(sorted(missing))}")

        severity = value["severity"]
        if severity not in SEVERITY_THRESHOLDS:
            raise ReviewError(f"unsupported severity: {severity!r}")

        file = value["file"]
        if not isinstance(file, str) or not file or len(file) > 500:
            raise ReviewError("finding.file must be a non-empty string up to 500 characters")
        file = normalize_repo_path(file)

        line = value["line"]
        if line is not None and (not isinstance(line, int) or isinstance(line, bool) or line < 1):
            raise ReviewError("finding.line must be null or a positive integer")

        confidence = value["confidence"]
        if not isinstance(confidence, (int, float)) or isinstance(confidence, bool):
            raise ReviewError("finding.confidence must be numeric")
        confidence = float(confidence)
        if confidence < 0 or confidence > 1:
            raise ReviewError("finding.confidence must be between 0 and 1")

        return cls(
            severity=severity,
            file=file,
            line=line,
            scenario=require_text(value["scenario"], "finding.scenario"),
            impact=require_text(value["impact"], "finding.impact"),
            fix=require_text(value["fix"], "finding.fix"),
            confidence=confidence,
        )

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)


@dataclasses.dataclass(frozen=True)
class Scope:
    schema_version: int
    base_sha: str
    head_sha: str
    status: str
    reason: str
    reviewable_files: tuple[str, ...]
    changed_lines: int
    line_map: Mapping[str, tuple[int, ...]]
    chunks: tuple[tuple[str, ...], ...] = ()

    @property
    def review_required(self) -> bool:
        return self.status == "review"

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "base_sha": self.base_sha,
            "head_sha": self.head_sha,
            "status": self.status,
            "reason": self.reason,
            "reviewable_files": list(self.reviewable_files),
            "changed_lines": self.changed_lines,
            "line_map": {key: list(value) for key, value in self.line_map.items()},
            "chunks": [list(chunk) for chunk in self.chunks],
        }

    @classmethod
    def from_file(cls, path: Path) -> "Scope":
        value = load_json(path)
        return cls(
            schema_version=int(value["schema_version"]),
            base_sha=str(value["base_sha"]),
            head_sha=str(value["head_sha"]),
            status=str(value["status"]),
            reason=str(value["reason"]),
            reviewable_files=tuple(str(item) for item in value["reviewable_files"]),
            changed_lines=int(value["changed_lines"]),
            line_map={str(key): tuple(int(line) for line in lines) for key, lines in value["line_map"].items()},
            chunks=tuple(tuple(str(path) for path in chunk) for chunk in value.get("chunks", [])),
        )


@dataclasses.dataclass(frozen=True)
class FinalResult:
    schema_version: int
    status: str
    reason: str
    head_sha: str
    summary: str
    findings: tuple[Finding, ...]
    dropped_findings: int
    verdict: str
    reaction: str
    blocking_count: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "status": self.status,
            "reason": self.reason,
            "head_sha": self.head_sha,
            "summary": self.summary,
            "findings": [finding.to_dict() for finding in self.findings],
            "dropped_findings": self.dropped_findings,
            "verdict": self.verdict,
            "reaction": self.reaction,
            "blocking_count": self.blocking_count,
        }

    @classmethod
    def from_file(cls, path: Path) -> "FinalResult":
        value = load_json(path)
        return cls(
            schema_version=int(value["schema_version"]),
            status=str(value["status"]),
            reason=str(value["reason"]),
            head_sha=str(value["head_sha"]),
            summary=str(value["summary"]),
            findings=tuple(Finding.from_mapping(item) for item in value["findings"]),
            dropped_findings=int(value["dropped_findings"]),
            verdict=str(value["verdict"]),
            reaction=str(value["reaction"]),
            blocking_count=int(value["blocking_count"]),
        )


def require_text(value: Any, field: str) -> str:
    if not isinstance(value, str):
        raise ReviewError(f"{field} must be a string")
    return value


def normalize_repo_path(value: str) -> str:
    value = value.replace("\\", "/").strip()
    while value.startswith("./"):
        value = value[2:]
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts:
        raise ReviewError(f"invalid repository path: {value!r}")
    return path.as_posix()


def is_reviewable_path(path: str) -> bool:
    normalized = normalize_repo_path(path)
    lower = normalized.lower()
    name = PurePosixPath(normalized).name.lower()
    if normalized in EXCLUDED_EXACT:
        return False
    if lower.startswith(EXCLUDED_PREFIXES):
        return False
    if name.startswith("readme"):
        return False
    return not lower.endswith(EXCLUDED_SUFFIXES)


def run_git(args: Sequence[str], *, cwd: Path) -> str:
    completed = subprocess.run(
        ["git", *args],
        cwd=cwd,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return completed.stdout


def changed_files(base_sha: str, head_sha: str, *, cwd: Path) -> list[str]:
    output = run_git(["diff", "--name-only", "--diff-filter=ACMRT", base_sha, head_sha], cwd=cwd)
    return sorted({normalize_repo_path(line) for line in output.splitlines() if line.strip()})


def changed_line_count(base_sha: str, head_sha: str, paths: Sequence[str], *, cwd: Path) -> int:
    if not paths:
        return 0
    output = run_git(["diff", "--numstat", base_sha, head_sha, "--", *paths], cwd=cwd)
    total = 0
    for row in output.splitlines():
        if not row.strip():
            continue
        added, deleted, *_ = row.split("\t")
        if added == "-" or deleted == "-":
            return MAX_CHANGED_LINES + 1
        total += int(added) + int(deleted)
    return total


def partition_by_limits(
    paths: Sequence[str], line_counts: Mapping[str, int]
) -> tuple[tuple[str, ...], ...]:
    chunks: list[tuple[str, ...]] = []
    current: list[str] = []
    current_lines = 0

    for path in paths:
        path_lines = max(0, int(line_counts.get(path, 0)))
        if current and (
            len(current) >= MAX_CHUNK_FILES
            or current_lines + path_lines > MAX_CHUNK_CHANGED_LINES
        ):
            chunks.append(tuple(current))
            current = []
            current_lines = 0
        current.append(path)
        current_lines += path_lines

    if current:
        chunks.append(tuple(current))
    return tuple(chunks)


def partition_review_files(
    base_sha: str, head_sha: str, paths: Sequence[str], *, cwd: Path
) -> tuple[tuple[str, ...], ...]:
    line_counts = {
        path: changed_line_count(base_sha, head_sha, [path], cwd=cwd)
        for path in paths
    }
    return partition_by_limits(paths, line_counts)


HUNK_RE = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")


def parse_changed_lines(diff_text: str) -> dict[str, tuple[int, ...]]:
    result: dict[str, set[int]] = {}
    current_file: str | None = None
    new_line: int | None = None

    for line in diff_text.splitlines():
        if line.startswith("+++ "):
            target = line[4:].strip()
            if target == "/dev/null":
                current_file = None
            elif target.startswith("b/"):
                current_file = normalize_repo_path(target[2:])
                result.setdefault(current_file, set())
            else:
                current_file = normalize_repo_path(target)
                result.setdefault(current_file, set())
            new_line = None
            continue

        match = HUNK_RE.match(line)
        if match:
            new_line = int(match.group(1))
            continue

        if current_file is None or new_line is None:
            continue
        if line.startswith("+") and not line.startswith("+++"):
            result[current_file].add(new_line)
            new_line += 1
        elif line.startswith("-") and not line.startswith("---"):
            continue
        else:
            new_line += 1

    return {path: tuple(sorted(lines)) for path, lines in result.items()}


def build_scope(base_sha: str, head_sha: str, *, cwd: Path, output_dir: Path) -> Scope:
    output_dir.mkdir(parents=True, exist_ok=True)
    for pattern in ("review-*.diff", "prompt-*.txt", "opencode-events-*.jsonl", "opencode-*.stderr"):
        for stale in output_dir.glob(pattern):
            stale.unlink(missing_ok=True)

    all_files = changed_files(base_sha, head_sha, cwd=cwd)
    reviewable = [path for path in all_files if is_reviewable_path(path)]
    count = changed_line_count(base_sha, head_sha, reviewable, cwd=cwd)
    chunks: tuple[tuple[str, ...], ...] = ()

    if not reviewable:
        status = "skipped"
        reason = "no-reviewable-files"
        line_map: dict[str, tuple[int, ...]] = {}
    elif len(reviewable) > MAX_REVIEW_FILES or count > MAX_CHANGED_LINES:
        status = "oversized"
        reason = "pr-too-large"
        line_map = {}
    else:
        chunks = partition_review_files(base_sha, head_sha, reviewable, cwd=cwd)
        if len(chunks) > MAX_REVIEW_CHUNKS:
            status = "oversized"
            reason = "too-many-review-chunks"
            line_map = {}
            chunks = ()
        else:
            status = "review"
            reason = "review-required"
            zero_context = run_git(["diff", "--unified=0", base_sha, head_sha, "--", *reviewable], cwd=cwd)
            line_map = parse_changed_lines(zero_context)
            for index, chunk in enumerate(chunks, start=1):
                suffix = f"{index:03d}"
                diff_text = run_git(["diff", "--unified=3", base_sha, head_sha, "--", *chunk], cwd=cwd)
                (output_dir / f"review-{suffix}.diff").write_text(diff_text, encoding="utf-8")
                (output_dir / f"prompt-{suffix}.txt").write_text(
                    render_prompt(head_sha, chunk), encoding="utf-8"
                )

    scope = Scope(
        schema_version=SCHEMA_VERSION,
        base_sha=base_sha,
        head_sha=head_sha,
        status=status,
        reason=reason,
        reviewable_files=tuple(reviewable),
        changed_lines=count,
        line_map=line_map,
        chunks=chunks,
    )
    write_json(output_dir / "scope.json", scope.to_dict())
    return scope


def render_prompt(head_sha: str, reviewable_files: Sequence[str]) -> str:
    files = "\n".join(f"- {path}" for path in reviewable_files)
    return f"""Проведи сфокусированное ревью приложенного diff Pull Request проекта parseVK.

Проверяемый HEAD: {head_sha}
Проверяемые файлы:
{files}

Правила:
1. Анализируй только приложенный diff и перечисленные изменённые файлы.
2. Дополнительный исходный файл открывай только для подтверждения достижимого дефекта из diff.
3. Не читай Markdown, README, docs/**, .github/ai-review/**, .github/scripts/ai_review* и .github/workflows/ai-code-review.yml.
4. Не создавай план, не меняй файлы, не запускай shell, внешние процессы или subagents.
5. Ищи только correctness, security, reliability, data integrity, compatibility и существенные performance-дефекты.
6. Не сообщай о стиле, форматировании, документации, общих улучшениях или проблемах вне diff.
7. Каждое замечание обязательно внеси в findings. При пустом findings замечаний нет.
8. Указывай строку из изменённого hunk. line=null допустим только для дефекта уровня конфигурации, схемы или миграции.
9. Используй только severity blocker, major или minor.
10. Верни строго один JSON-объект без Markdown и текста до или после.

Схема результата:
{{
  "status": "completed",
  "head_sha": "{head_sha}",
  "summary": "Общий итог без отдельных рекомендаций",
  "findings": [
    {{
      "severity": "blocker|major|minor",
      "file": "path/to/file",
      "line": 123,
      "scenario": "Как воспроизводится дефект",
      "impact": "Последствия",
      "fix": "Конкретное исправление",
      "confidence": 0.95
    }}
  ]
}}

При невозможности закончить анализ верни status=technical-error, точный head_sha и пустой findings.
"""


def extract_text_events(events_path: Path) -> str:
    texts: list[str] = []
    errors: list[str] = []
    for raw_line in events_path.read_text(encoding="utf-8", errors="replace").splitlines():
        if not raw_line.strip():
            continue
        try:
            event = json.loads(raw_line)
        except json.JSONDecodeError:
            continue
        if event.get("type") == "error":
            errors.append(json.dumps(event.get("error"), ensure_ascii=False))
        if event.get("type") != "text":
            continue
        part = event.get("part")
        if isinstance(part, Mapping) and isinstance(part.get("text"), str):
            texts.append(part["text"])
    if not texts:
        detail = "; ".join(errors) if errors else "no final text event"
        raise ReviewError(f"OpenCode produced no review JSON: {detail}")
    return "\n".join(texts).strip()


def extract_json_object(text: str) -> Mapping[str, Any]:
    stripped = text.strip()
    candidates = [stripped]
    fenced = re.findall(r"```(?:json)?\s*(\{.*?\})\s*```", stripped, flags=re.DOTALL | re.IGNORECASE)
    candidates.extend(reversed(fenced))

    decoder = json.JSONDecoder()
    for index, char in enumerate(stripped):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(stripped[index:])
        except json.JSONDecodeError:
            continue
        candidates.append(json.dumps(value, ensure_ascii=False))

    for candidate in candidates:
        try:
            value = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(value, Mapping):
            return value
    raise ReviewError("OpenCode final text does not contain a JSON object")


def validate_model_result(value: Mapping[str, Any], expected_head: str) -> tuple[str, str, list[Finding]]:
    status = value.get("status")
    if status not in {"completed", "technical-error"}:
        raise ReviewError("result.status must be completed or technical-error")
    if value.get("head_sha") != expected_head:
        raise ReviewError("result.head_sha does not match the current Pull Request HEAD")
    summary = require_text(value.get("summary"), "result.summary")
    raw_findings = value.get("findings")
    if not isinstance(raw_findings, list) or len(raw_findings) > MAX_FINDINGS:
        raise ReviewError(f"result.findings must be an array with at most {MAX_FINDINGS} items")
    findings = [Finding.from_mapping(item) for item in raw_findings if isinstance(item, Mapping)]
    if len(findings) != len(raw_findings):
        raise ReviewError("every finding must be an object")
    return status, summary, findings


def sanitize(value: str, limit: int) -> str:
    value = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)
    value = re.sub(r"[\r\n\t]+", " ", value)
    value = re.sub(r"\s{2,}", " ", value).strip()
    value = value.replace("@", "@\u200b").replace("`", "")
    value = value.replace("<", "&lt;").replace(">", "&gt;")
    return value if len(value) <= limit else value[:limit] + "…"


def file_level_allowed(path: str) -> bool:
    lower = path.lower()
    if lower.endswith(FILE_LEVEL_SUFFIXES):
        return True
    components = {component.lower() for component in PurePosixPath(path).parts}
    return any(part in components for part in FILE_LEVEL_PARTS)


def line_is_changed(path: str, line: int | None, line_map: Mapping[str, Sequence[int]]) -> bool:
    if line is None:
        return file_level_allowed(path)
    changed = line_map.get(path, ())
    return any(abs(line - candidate) <= CONTEXT_RADIUS for candidate in changed)


def filter_findings(findings: Sequence[Finding], scope: Scope) -> tuple[tuple[Finding, ...], int]:
    accepted: list[Finding] = []
    reviewable = set(scope.reviewable_files)
    for finding in findings:
        if finding.confidence < SEVERITY_THRESHOLDS[finding.severity]:
            continue
        if finding.file not in reviewable or not is_reviewable_path(finding.file):
            continue
        if not line_is_changed(finding.file, finding.line, scope.line_map):
            continue
        accepted.append(
            dataclasses.replace(
                finding,
                scenario=sanitize(finding.scenario, 1000),
                impact=sanitize(finding.impact, 1000),
                fix=sanitize(finding.fix, 1000),
            )
        )
    return tuple(accepted), len(findings) - len(accepted)


def unavailable_result(head_sha: str, reason: str, summary: str) -> FinalResult:
    return FinalResult(
        schema_version=SCHEMA_VERSION,
        status="technical-error",
        reason=reason,
        head_sha=head_sha,
        summary=sanitize(summary, 600),
        findings=(),
        dropped_findings=0,
        verdict="unavailable",
        reaction="",
        blocking_count=0,
    )


def oversized_result(scope: Scope) -> FinalResult:
    return FinalResult(
        schema_version=SCHEMA_VERSION,
        status="blocked",
        reason=scope.reason,
        head_sha=scope.head_sha,
        summary=sanitize(
            f"AI-ревью не выполнено: PR превышает предел {MAX_REVIEW_FILES} файлов "
            f"или {MAX_CHANGED_LINES} изменённых строк "
            f"({len(scope.reviewable_files)} файлов, {scope.changed_lines} строк).",
            600,
        ),
        findings=(),
        dropped_findings=0,
        verdict="review-required",
        reaction="",
        blocking_count=0,
    )


def skipped_result(scope: Scope) -> FinalResult:
    return FinalResult(
        schema_version=SCHEMA_VERSION,
        status="skipped",
        reason=scope.reason,
        head_sha=scope.head_sha,
        summary="AI-анализ не запускался: нет проверяемых файлов.",
        findings=(),
        dropped_findings=0,
        verdict="approved",
        reaction="+1",
        blocking_count=0,
    )


def event_paths(events_path: Path | None) -> tuple[Path, ...]:
    if events_path is None or not events_path.exists():
        return ()
    if events_path.is_file():
        return (events_path,)
    return tuple(sorted(events_path.glob("opencode-events-*.jsonl")))


def finalize_result(scope: Scope, events_path: Path | None, exit_code: int) -> FinalResult:
    if scope.status == "skipped":
        return skipped_result(scope)
    if scope.status == "oversized":
        return oversized_result(scope)
    if exit_code != 0:
        return unavailable_result(scope.head_sha, "opencode-failed", f"OpenCode завершился с кодом {exit_code}.")

    paths = event_paths(events_path)
    if not paths:
        return unavailable_result(scope.head_sha, "missing-events", "Файлы событий OpenCode отсутствуют.")

    try:
        summaries: list[str] = []
        model_findings: list[Finding] = []
        for path in paths:
            text = extract_text_events(path)
            raw = extract_json_object(text)
            status, summary, findings = validate_model_result(raw, scope.head_sha)
            if status == "technical-error":
                return unavailable_result(scope.head_sha, "model-technical-error", summary)
            summaries.append(summary)
            model_findings.extend(findings)

        unique: dict[tuple[Any, ...], Finding] = {}
        for finding in model_findings:
            key = (
                finding.severity,
                finding.file,
                finding.line,
                finding.scenario,
                finding.impact,
                finding.fix,
            )
            unique.setdefault(key, finding)
        accepted, dropped = filter_findings(tuple(unique.values()), scope)
        dropped += len(model_findings) - len(unique)
        summary = " | ".join(summaries)
    except ReviewError as error:
        return unavailable_result(scope.head_sha, "invalid-model-result", str(error))

    blocking = sum(1 for finding in accepted if finding.severity in BLOCKING_SEVERITIES)
    if blocking:
        verdict, reaction = "changes-required", "-1"
    elif accepted:
        verdict, reaction = "findings", "confused"
    else:
        verdict, reaction = "approved", "+1"

    return FinalResult(
        schema_version=SCHEMA_VERSION,
        status="completed",
        reason="review-completed",
        head_sha=scope.head_sha,
        summary=sanitize(summary, 600),
        findings=accepted,
        dropped_findings=dropped,
        verdict=verdict,
        reaction=reaction,
        blocking_count=blocking,
    )


class GitHubApi:
    def __init__(self, repository: str, token: str, api_url: str = "https://api.github.com") -> None:
        if "/" not in repository:
            raise ReviewError("GITHUB_REPOSITORY must be owner/name")
        self.repository = repository
        self.api_url = api_url.rstrip("/")
        self.headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "parsevk-ai-reviewer",
        }

    def request(self, method: str, path: str, body: Mapping[str, Any] | None = None) -> Any:
        data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            f"{self.api_url}{path}",
            data=data,
            headers=self.headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = response.read()
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise ReviewError(f"GitHub API {method} {path} failed: {error.code} {detail}") from error
        if not payload:
            return None
        return json.loads(payload)

    def paginated(self, path: str) -> Iterable[Any]:
        separator = "&" if "?" in path else "?"
        page = 1
        while True:
            items = self.request("GET", f"{path}{separator}per_page=100&page={page}")
            if not isinstance(items, list):
                raise ReviewError(f"expected a list from paginated endpoint {path}")
            yield from items
            if len(items) < 100:
                return
            page += 1

    def pr(self, number: int) -> Mapping[str, Any]:
        value = self.request("GET", f"/repos/{self.repository}/pulls/{number}")
        if not isinstance(value, Mapping):
            raise ReviewError("GitHub returned an invalid Pull Request payload")
        return value

    def bot_reactions(self, number: int) -> list[Mapping[str, Any]]:
        return [
            item
            for item in self.paginated(f"/repos/{self.repository}/issues/{number}/reactions")
            if isinstance(item, Mapping) and nested(item, "user", "login") == "github-actions[bot]"
        ]

    def set_reaction(self, number: int, content: str) -> None:
        for reaction in self.bot_reactions(number):
            self.request("DELETE", f"/repos/{self.repository}/issues/{number}/reactions/{reaction['id']}")
        self.request("POST", f"/repos/{self.repository}/issues/{number}/reactions", {"content": content})

    def remove_reactions(self, number: int) -> None:
        for reaction in self.bot_reactions(number):
            self.request("DELETE", f"/repos/{self.repository}/issues/{number}/reactions/{reaction['id']}")

    def review_comments(self, number: int) -> list[Mapping[str, Any]]:
        return [
            item
            for item in self.paginated(f"/repos/{self.repository}/issues/{number}/comments")
            if isinstance(item, Mapping)
            and nested(item, "user", "login") == "github-actions[bot]"
            and isinstance(item.get("body"), str)
            and any(marker in item["body"] for marker in REVIEW_COMMENT_MARKERS)
        ]

    def remove_review_comments(self, number: int) -> None:
        for comment in self.review_comments(number):
            self.request("DELETE", f"/repos/{self.repository}/issues/comments/{comment['id']}")

    def find_review_issue(self, number: int) -> Mapping[str, Any] | None:
        marker = ISSUE_MARKER_TEMPLATE.format(pr_number=number)
        for issue in self.paginated(f"/repos/{self.repository}/issues?state=all&labels=ai-review"):
            if not isinstance(issue, Mapping) or "pull_request" in issue:
                continue
            if marker in str(issue.get("body") or ""):
                return issue
        return None

    def ensure_labels(self) -> None:
        labels = {
            "ai-review": ("5319e7", "Автоматическое ревью кода"),
            "ai-review:findings": ("d29922", "AI-ревью нашло неблокирующие замечания"),
            "ai-review:changes-required": ("d1242f", "AI-ревью требует исправлений"),
        }
        for name, (color, description) in labels.items():
            try:
                self.request("POST", f"/repos/{self.repository}/labels", {"name": name, "color": color, "description": description})
            except ReviewError as error:
                if "422" not in str(error):
                    raise

    def create_or_update_issue(self, *, number: int, title: str, body: str, label: str) -> int:
        existing = self.find_review_issue(number)
        payload = {"title": title, "body": body, "state": "open", "labels": ["ai-review", label]}
        if existing is None:
            created = self.request("POST", f"/repos/{self.repository}/issues", payload)
            return int(created["number"])
        issue_number = int(existing["number"])
        self.request("PATCH", f"/repos/{self.repository}/issues/{issue_number}", payload)
        return issue_number

    def close_review_issue(self, number: int, reason: str = "completed") -> None:
        existing = self.find_review_issue(number)
        if existing is None or existing.get("state") == "closed":
            return
        self.request("PATCH", f"/repos/{self.repository}/issues/{existing['number']}", {"state": "closed", "state_reason": reason})

    def create_comment(self, number: int, body: str) -> None:
        self.request("POST", f"/repos/{self.repository}/issues/{number}/comments", {"body": body})


def nested(value: Mapping[str, Any], *keys: str) -> Any:
    current: Any = value
    for key in keys:
        if not isinstance(current, Mapping):
            return None
        current = current.get(key)
    return current


def render_findings(result: FinalResult) -> str:
    sections: list[str] = []
    for index, finding in enumerate(result.findings, start=1):
        line = "не указана" if finding.line is None else str(finding.line)
        sections.append(
            f"### {index}. {finding.severity.upper()}\n\n"
            f"- **Файл:** `{finding.file}`\n"
            f"- **Строка:** {line}\n"
            f"- **Уверенность:** {finding.confidence:.2f}\n"
            f"- **Сценарий:** {finding.scenario}\n"
            f"- **Последствия:** {finding.impact}\n"
            f"- **Исправление:** {finding.fix}\n"
        )
    return "\n".join(sections)


def publish_result(api: GitHubApi, pr_number: int, pr_title: str, result: FinalResult) -> int:
    current_head = str(nested(api.pr(pr_number), "head", "sha") or "")
    if current_head != result.head_sha:
        print(f"Obsolete review ignored: expected {result.head_sha}, current {current_head}")
        return 0

    api.remove_review_comments(pr_number)

    if result.verdict == "unavailable":
        api.remove_reactions(pr_number)
        print(f"::warning::{result.summary}")
        return 0

    if result.verdict == "review-required":
        api.remove_reactions(pr_number)
        api.create_comment(
            pr_number,
            "<!-- ai-review:canonical -->\n## AI Code Review не выполнено\n\n"
            f"{result.summary}\n\n"
            "Разделите Pull Request на меньшие части или выполните отдельное ручное ревью.",
        )
        print(f"::error::{result.summary}")
        return 1

    if result.verdict == "approved":
        api.close_review_issue(pr_number)
        api.set_reaction(pr_number, "+1")
        print("AI Review passed: no confirmed findings.")
        return 0

    api.ensure_labels()
    issue_label = "ai-review:changes-required" if result.verdict == "changes-required" else "ai-review:findings"
    marker = ISSUE_MARKER_TEMPLATE.format(pr_number=pr_number)
    body = (
        f"{marker}\n# AI Code Review для PR #{pr_number}\n\n"
        f"Связанный PR: #{pr_number}\n\n"
        f"**Проверен commit:** `{result.head_sha}`\n\n"
        f"**Вердикт:** `{result.verdict}`\n\n"
        f"Найдено замечаний: {len(result.findings)}. Блокирующих: {result.blocking_count}.\n\n"
        f"{render_findings(result)}"
    )
    title = f"[AI Review] PR #{pr_number}: {pr_title[:180]}"
    issue_number = api.create_or_update_issue(number=pr_number, title=title, body=body, label=issue_label)
    api.create_comment(
        pr_number,
        "<!-- ai-review:canonical -->\n## AI Code Review\n\n"
        f"Найдено замечаний: {len(result.findings)}. Блокирующих: {result.blocking_count}.\n\n"
        f"Подробности и исправления: #{issue_number}",
    )
    api.set_reaction(pr_number, result.reaction)
    if result.verdict == "changes-required":
        print(f"::error::AI Review requires changes. Issue #{issue_number}")
        return 1
    print(f"AI Review found non-blocking findings. Issue #{issue_number}")
    return 0


def github_from_env() -> GitHubApi:
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    token = os.environ.get("GITHUB_TOKEN", "") or os.environ.get("GH_TOKEN", "")
    if not token:
        raise ReviewError("GITHUB_TOKEN is required")
    return GitHubApi(repository, token, os.environ.get("GITHUB_API_URL", "https://api.github.com"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def command_scope(args: argparse.Namespace) -> int:
    scope = build_scope(args.base, args.head, cwd=args.cwd, output_dir=args.output_dir)
    print(json.dumps(scope.to_dict(), ensure_ascii=False))
    return 0


def command_finalize(args: argparse.Namespace) -> int:
    scope = Scope.from_file(args.scope)
    result = finalize_result(scope, args.events, args.exit_code)
    write_json(args.output, result.to_dict())
    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0


def command_fallback(args: argparse.Namespace) -> int:
    result = unavailable_result(args.head, args.reason, args.summary)
    write_json(args.output, result.to_dict())
    return 0


def command_mark(args: argparse.Namespace) -> int:
    github_from_env().set_reaction(args.pr, "eyes")
    return 0


def command_publish(args: argparse.Namespace) -> int:
    result = FinalResult.from_file(args.result)
    return publish_result(github_from_env(), args.pr, args.title, result)


def command_cleanup(args: argparse.Namespace) -> int:
    api = github_from_env()
    api.remove_review_comments(args.pr)
    api.remove_reactions(args.pr)
    api.close_review_issue(args.pr, reason="completed" if args.merged else "not_planned")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="command", required=True)

    scope = commands.add_parser("scope")
    scope.add_argument("--base", required=True)
    scope.add_argument("--head", required=True)
    scope.add_argument("--cwd", type=Path, default=Path.cwd())
    scope.add_argument("--output-dir", type=Path, required=True)
    scope.set_defaults(func=command_scope)

    finalize = commands.add_parser("finalize")
    finalize.add_argument("--scope", type=Path, required=True)
    finalize.add_argument("--events", type=Path)
    finalize.add_argument("--exit-code", type=int, default=0)
    finalize.add_argument("--output", type=Path, required=True)
    finalize.set_defaults(func=command_finalize)

    fallback = commands.add_parser("fallback")
    fallback.add_argument("--head", required=True)
    fallback.add_argument("--reason", required=True)
    fallback.add_argument("--summary", required=True)
    fallback.add_argument("--output", type=Path, required=True)
    fallback.set_defaults(func=command_fallback)

    mark = commands.add_parser("mark")
    mark.add_argument("--pr", type=int, required=True)
    mark.set_defaults(func=command_mark)

    publish = commands.add_parser("publish")
    publish.add_argument("--pr", type=int, required=True)
    publish.add_argument("--title", required=True)
    publish.add_argument("--result", type=Path, required=True)
    publish.set_defaults(func=command_publish)

    cleanup = commands.add_parser("cleanup")
    cleanup.add_argument("--pr", type=int, required=True)
    cleanup.add_argument("--merged", action="store_true")
    cleanup.set_defaults(func=command_cleanup)
    return root


def main(argv: Sequence[str] | None = None) -> int:
    try:
        args = parser().parse_args(argv)
        return int(args.func(args))
    except ReviewError as error:
        print(f"ai-review error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

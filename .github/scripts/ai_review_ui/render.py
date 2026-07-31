from __future__ import annotations

from collections import Counter
from collections.abc import Sequence

from .markdown import render_alert, render_confidence, render_finding_sections
from .models import Finding, ReviewResult
from .titles import compact_title
from .verdict import verdict_alert_kind, verdict_text

MAX_INLINE_COMMENTS = 12
SEVERITY_ORDER = {"blocker": 0, "major": 1, "minor": 2}
SEVERITY_STYLE = {
    "blocker": ("🔴", "Blocker"),
    "major": ("🟠", "Major"),
    "minor": ("🟡", "Minor"),
}
REVIEW_MARKER = "<!-- parsevk-ai-review:{head_sha} -->"
INLINE_MARKER = "<!-- parsevk-ai-review:inline -->"


def sort_findings(findings: Sequence[Finding]) -> tuple[Finding, ...]:
    return tuple(
        sorted(
            findings,
            key=lambda item: (
                SEVERITY_ORDER[item.severity],
                item.file,
                item.line or 0,
                item.scenario,
            ),
        )
    )


def render_inline_finding(finding: Finding) -> str:
    icon, label = SEVERITY_STYLE[finding.severity]
    return "\n\n".join(
        (
            INLINE_MARKER,
            f"### {icon} {label} · {compact_title(finding)}",
            *render_finding_sections(finding),
            render_confidence(finding),
        )
    )


def render_file_finding(finding: Finding, index: int) -> str:
    icon, label = SEVERITY_STYLE[finding.severity]
    location = f"`{finding.file}`"
    if finding.line is not None:
        location += f" · строка {finding.line}"
    return "\n\n".join(
        (
            f"#### {index}. {icon} {label} · {compact_title(finding)}",
            f"<sub>📄 {location}</sub>",
            *render_finding_sections(finding),
            render_confidence(finding),
        )
    )


def count_summary(findings: Sequence[Finding]) -> str:
    counts = Counter(item.severity for item in findings)
    parts = []
    for severity in ("blocker", "major", "minor"):
        if counts[severity]:
            icon, label = SEVERITY_STYLE[severity]
            parts.append(f"{icon} {counts[severity]} {label.lower()}")
    return " · ".join(parts) or "нет"


def split_findings(
    result: ReviewResult,
) -> tuple[tuple[Finding, ...], tuple[Finding, ...]]:
    ordered = sort_findings(result.findings)
    line_findings = tuple(item for item in ordered if item.line is not None)
    inline = line_findings[:MAX_INLINE_COMMENTS]
    inline_ids = {id(item) for item in inline}
    overflow = tuple(
        item for item in ordered if item.line is None or id(item) not in inline_ids
    )
    return inline, overflow


def render_review_body(
    result: ReviewResult,
    overflow: Sequence[Finding],
) -> str:
    summary = "\n\n".join(
        (
            verdict_text(result),
            result.summary,
            f"Проверен commit `{result.head_sha[:10]}`",
            f"Замечания: {count_summary(result.findings)}",
        )
    )
    sections = [
        REVIEW_MARKER.format(head_sha=result.head_sha),
        "### 🔍 parseVK AI Review",
        "",
        render_alert(verdict_alert_kind(result), "Итог ревью", summary),
    ]
    if overflow:
        sections.extend(
            [
                "",
                f"<details><summary>📄 Остальные замечания ({len(overflow)})</summary>",
                "",
                *(
                    render_file_finding(finding, index)
                    for index, finding in enumerate(overflow, start=1)
                ),
                "</details>",
            ]
        )
    sections.extend(
        [
            "",
            "<sub>Опубликованы только findings, прошедшие проверку HEAD, "
            "confidence и привязки к diff.</sub>",
        ]
    )
    return "\n".join(sections)

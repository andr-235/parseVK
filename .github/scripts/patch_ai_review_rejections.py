from pathlib import Path

path = Path(".github/scripts/ai_review.py")
text = path.read_text(encoding="utf-8")
old = '''def filter_findings(findings: Sequence[Finding], scope: Scope) -> tuple[tuple[Finding, ...], int]:
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
'''
new = '''def log_rejected_finding(reason: str, finding: Finding) -> None:
    metadata = {
        "reason": reason,
        "severity": finding.severity,
        "file": finding.file,
        "line": finding.line,
        "confidence": round(finding.confidence, 4),
    }
    print(f"AI_REVIEW_REJECTED {json.dumps(metadata, ensure_ascii=False, sort_keys=True)}")


def filter_findings(findings: Sequence[Finding], scope: Scope) -> tuple[tuple[Finding, ...], int]:
    accepted: list[Finding] = []
    reviewable = set(scope.reviewable_files)
    for finding in findings:
        if finding.confidence < SEVERITY_THRESHOLDS[finding.severity]:
            log_rejected_finding("below-confidence", finding)
            continue
        if finding.file not in reviewable or not is_reviewable_path(finding.file):
            log_rejected_finding("outside-review-scope", finding)
            continue
        if not line_is_changed(finding.file, finding.line, scope.line_map):
            log_rejected_finding("outside-changed-lines", finding)
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
'''
if text.count(old) != 1:
    raise RuntimeError(f"expected exactly one filter_findings block, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")

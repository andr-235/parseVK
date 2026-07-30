from pathlib import Path

reviewer = Path(".github/scripts/ai_review.py")
text = reviewer.read_text(encoding="utf-8")

constant_old = "CONTEXT_RADIUS = 3\n"
constant_new = "CONTEXT_RADIUS = 3\nREANCHOR_RADIUS = 5\n"
if text.count(constant_old) != 1:
    raise RuntimeError("expected one CONTEXT_RADIUS declaration")
text = text.replace(constant_old, constant_new, 1)

filter_old = '''def line_is_changed(path: str, line: int | None, line_map: Mapping[str, Sequence[int]]) -> bool:
    if line is None:
        return file_level_allowed(path)
    changed = line_map.get(path, ())
    return any(abs(line - candidate) <= CONTEXT_RADIUS for candidate in changed)


def log_rejected_finding(reason: str, finding: Finding) -> None:
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
filter_new = '''def anchor_finding_line(
    path: str,
    line: int | None,
    line_map: Mapping[str, Sequence[int]],
) -> tuple[bool, int | None]:
    if line is None:
        return file_level_allowed(path), None
    changed = tuple(line_map.get(path, ()))
    if not changed:
        return False, None
    nearest = min(changed, key=lambda candidate: abs(line - candidate))
    if abs(line - nearest) > REANCHOR_RADIUS:
        return False, None
    return True, nearest


def log_rejected_finding(reason: str, finding: Finding) -> None:
    metadata = {
        "reason": reason,
        "severity": finding.severity,
        "file": finding.file,
        "line": finding.line,
        "confidence": round(finding.confidence, 4),
    }
    print(f"AI_REVIEW_REJECTED {json.dumps(metadata, ensure_ascii=False, sort_keys=True)}")


def log_reanchored_finding(finding: Finding, anchored_line: int) -> None:
    metadata = {
        "file": finding.file,
        "from_line": finding.line,
        "to_line": anchored_line,
        "severity": finding.severity,
    }
    print(f"AI_REVIEW_REANCHORED {json.dumps(metadata, ensure_ascii=False, sort_keys=True)}")


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
        anchored, line = anchor_finding_line(finding.file, finding.line, scope.line_map)
        if not anchored:
            log_rejected_finding("outside-changed-lines", finding)
            continue
        if finding.line is not None and line is not None and finding.line != line:
            log_reanchored_finding(finding, line)
        accepted.append(
            dataclasses.replace(
                finding,
                line=line,
                scenario=sanitize(finding.scenario, 1000),
                impact=sanitize(finding.impact, 1000),
                fix=sanitize(finding.fix, 1000),
            )
        )
    return tuple(accepted), len(findings) - len(accepted)
'''
if text.count(filter_old) != 1:
    raise RuntimeError(f"expected one filter block, found {text.count(filter_old)}")
reviewer.write_text(text.replace(filter_old, filter_new, 1), encoding="utf-8")

tests = Path(".github/scripts/test_ai_review.py")
test_text = tests.read_text(encoding="utf-8")
needle = '''        self.assertEqual(result.summary, "Подтверждённых замечаний нет.")

    def test_file_level_config_finding_is_allowed(self) -> None:
'''
insertion = '''        self.assertEqual(result.summary, "Подтверждённых замечаний нет.")

    def test_nearby_line_is_reanchored_to_changed_line(self) -> None:
        events = self.write_events(
            {
                "status": "completed",
                "head_sha": "b" * 40,
                "summary": "nearby",
                "findings": [
                    {
                        "severity": "major",
                        "file": "src/app.py",
                        "line": 15,
                        "scenario": "scenario",
                        "impact": "impact",
                        "fix": "fix",
                        "confidence": 0.99,
                    }
                ],
            }
        )
        result = ai_review.finalize_result(self.scope(), events, 0)
        self.assertEqual(result.verdict, "changes-required")
        self.assertEqual(result.findings[0].line, 11)
        self.assertEqual(result.dropped_findings, 0)

    def test_file_level_config_finding_is_allowed(self) -> None:
'''
if test_text.count(needle) != 1:
    raise RuntimeError(f"expected one test insertion point, found {test_text.count(needle)}")
tests.write_text(test_text.replace(needle, insertion, 1), encoding="utf-8")

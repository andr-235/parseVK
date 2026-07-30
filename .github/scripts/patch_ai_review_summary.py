from pathlib import Path

root = Path(__file__).resolve().parents[2]
reviewer = root / ".github/scripts/ai_review.py"
tests = root / ".github/scripts/test_ai_review.py"

reviewer_text = reviewer.read_text(encoding="utf-8")
tests_text = tests.read_text(encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


reviewer_text = replace_once(
    reviewer_text,
    '''def event_paths(events_path: Path | None) -> tuple[Path, ...]:
    if events_path is None or not events_path.exists():
        return ()
    if events_path.is_file():
        return (events_path,)
    return tuple(sorted(events_path.glob("opencode-events-*.jsonl")))


def finalize_result''',
    '''def event_paths(events_path: Path | None) -> tuple[Path, ...]:
    if events_path is None or not events_path.exists():
        return ()
    if events_path.is_file():
        return (events_path,)
    return tuple(sorted(events_path.glob("opencode-events-*.jsonl")))


def render_result_summary(findings: Sequence[Finding]) -> str:
    if not findings:
        return "Подтверждённых замечаний нет."
    counts = {
        severity: sum(1 for finding in findings if finding.severity == severity)
        for severity in ("blocker", "major", "minor")
    }
    parts = [f"{severity}: {count}" for severity, count in counts.items() if count]
    return f"Подтверждено замечаний: {len(findings)} ({', '.join(parts)})."


def finalize_result''',
    "summary renderer",
)
reviewer_text = replace_once(
    reviewer_text,
    "        summaries: list[str] = []\n        model_findings: list[Finding] = []\n",
    "        model_findings: list[Finding] = []\n",
    "summary accumulator",
)
reviewer_text = replace_once(
    reviewer_text,
    "            summaries.append(summary)\n            model_findings.extend(findings)\n",
    "            model_findings.extend(findings)\n",
    "model summary append",
)
reviewer_text = replace_once(
    reviewer_text,
    '        summary = " | ".join(summaries)\n',
    "        summary = render_result_summary(accepted)\n",
    "deterministic final summary",
)

tests_text = replace_once(
    tests_text,
    '        self.assertEqual(result.reaction, "+1")\n\n    def test_minor_is_non_blocking_and_confused',
    '        self.assertEqual(result.reaction, "+1")\n'
    '        self.assertEqual(result.summary, "Подтверждённых замечаний нет.")\n\n'
    '    def test_minor_is_non_blocking_and_confused',
    "clean summary test",
)
tests_text = replace_once(
    tests_text,
    '        self.assertEqual(len(result.findings), 1)\n'
    '        self.assertIn("chunk 1", result.summary)\n'
    '        self.assertIn("chunk 2", result.summary)\n',
    '        self.assertEqual(len(result.findings), 1)\n'
    '        self.assertEqual(result.summary, "Подтверждено замечаний: 1 (minor: 1).")\n',
    "chunk summary test",
)
tests_text = replace_once(
    tests_text,
    '        self.assertEqual(result.verdict, "approved")\n'
    '        self.assertEqual(result.dropped_findings, 1)\n\n'
    '    def test_file_level_config_finding_is_allowed',
    '        self.assertEqual(result.verdict, "approved")\n'
    '        self.assertEqual(result.dropped_findings, 1)\n'
    '        self.assertEqual(result.summary, "Подтверждённых замечаний нет.")\n\n'
    '    def test_file_level_config_finding_is_allowed',
    "dropped summary test",
)

reviewer.write_text(reviewer_text, encoding="utf-8")
tests.write_text(tests_text, encoding="utf-8")

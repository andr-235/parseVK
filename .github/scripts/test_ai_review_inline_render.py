from __future__ import annotations

import unittest

from ai_review_ui.models import Finding, ReviewResult
from ai_review_ui.render import (
    MAX_INLINE_COMMENTS,
    render_inline_finding,
    render_review_body,
    split_findings,
)


def finding(
    *,
    severity: str = "major",
    line: int | None = 10,
    index: int = 1,
    scenario: str | None = None,
) -> Finding:
    return Finding(
        severity=severity,
        file=f"src/file_{index}.py",
        line=line,
        scenario=scenario or f"Сценарий дефекта {index}",
        impact=f"Последствие {index}",
        fix=f"Добавьте проверку {index}. Затем обновите тесты.",
        confidence=0.96,
    )


def result(*findings: Finding) -> ReviewResult:
    return ReviewResult(
        head_sha="a" * 40,
        status="completed",
        reason="review-completed",
        summary="summary",
        verdict="changes-required",
        findings=tuple(findings),
        blocking_count=len(findings),
    )


class RenderTests(unittest.TestCase):
    def test_inline_comment_uses_structured_github_alerts(self) -> None:
        body = render_inline_finding(finding())
        self.assertIn("### 🟠 Major · Добавьте проверку 1", body)
        self.assertIn("> [!NOTE]\n> **Что не так**", body)
        self.assertIn("> [!WARNING]\n> **Последствия**", body)
        self.assertIn("> [!TIP]\n> **Как исправить**", body)
        self.assertIn("📈 Уверенность: 96%", body)
        self.assertIn("🧠 Big Pickle", body)
        self.assertIn("🛡️ diff-фильтры parseVK", body)

    def test_multiline_model_text_stays_inside_alert(self) -> None:
        body = render_inline_finding(
            finding(scenario="Первая строка\n\nВторая строка")
        )
        self.assertIn("> Первая строка\n>\n> Вторая строка", body)

    def test_overflow_is_kept_in_structured_review_summary(self) -> None:
        findings = tuple(finding(index=index) for index in range(1, 15))
        inline, overflow = split_findings(result(*findings))
        self.assertEqual(len(inline), MAX_INLINE_COMMENTS)
        self.assertEqual(len(overflow), 2)
        body = render_review_body(result(*findings), overflow)
        self.assertIn("Остальные замечания (2)", body)
        self.assertIn("> [!CAUTION]\n> **Итог ревью**", body)
        self.assertIn("Проверен commit", body)
        for item in overflow:
            self.assertIn(f"📄 `{item.file}` · строка {item.line}", body)

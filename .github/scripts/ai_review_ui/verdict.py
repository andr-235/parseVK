from __future__ import annotations

from .models import ReviewResult


def verdict_text(result: ReviewResult) -> str:
    if result.verdict == "changes-required":
        return "🔴 Требуются изменения"
    if result.verdict == "review-required":
        return "🟠 Требуется ручное ревью"
    if result.verdict == "findings":
        return "🟡 Есть неблокирующие замечания"
    return "🟢 Подтверждённых замечаний нет"


def verdict_alert_kind(result: ReviewResult) -> str:
    if result.verdict == "changes-required":
        return "CAUTION"
    if result.verdict == "review-required":
        return "IMPORTANT"
    if result.verdict == "findings":
        return "WARNING"
    return "TIP"

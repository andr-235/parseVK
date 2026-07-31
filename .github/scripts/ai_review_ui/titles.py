from __future__ import annotations

import re
from collections.abc import Sequence

from .models import Finding

MAX_DIRECT_TITLE_LENGTH = 88
FALLBACK_TITLE = "Требуется исправление"
CATEGORY_PATTERNS: Sequence[tuple[str, tuple[str, ...]]] = (
    (
        "Безопасность",
        (
            "уязвим", "безопас", "секрет", "токен", "парол", "auth", "permission",
            "injection", "xss", "csrf", "доступ",
        ),
    ),
    (
        "Надёжность",
        (
            "сбой", "ошиб", "исключен", "потер", "гонк", "race", "deadlock",
            "timeout", "retry", "недоступ", "fallback",
        ),
    ),
    (
        "Производительность",
        (
            "производ", "медлен", "нагруз", "памят", "кэш", "cache", "n+1",
            "лишн", "оптимиз",
        ),
    ),
    (
        "Тестирование",
        ("тест", "покрыт", "coverage", "assert", "fixture", "mock"),
    ),
    (
        "Контракты и совместимость",
        (
            "контракт", "схем", "schema", "api", "совместим", "migration", "миграц",
            "формат", "верси",
        ),
    ),
    (
        "Полнота реализации",
        (
            "отсутств", "не добав", "реализац", "модул", "module", "import",
            "не существует", "не определ", "missing",
        ),
    ),
    (
        "Сопровождаемость",
        (
            "дублир", "сложн", "декомпоз", "разделите файл", "лимит", "строк",
            "рефактор", "повтор",
        ),
    ),
)


def normalize_title_source(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip(" .:;!?—-")


def first_clause(value: str) -> str:
    return re.split(r"(?<=[.!?])\s+|;\s+", value, maxsplit=1)[0]


def matches_pattern(text: str, pattern: str) -> bool:
    if " " in pattern or not pattern.isalnum():
        return pattern in text
    return re.search(rf"(?<!\w){re.escape(pattern)}\w*", text) is not None


def category_title(finding: Finding) -> str:
    haystack = " ".join((finding.scenario, finding.impact, finding.fix)).lower()
    for title, patterns in CATEGORY_PATTERNS:
        if any(matches_pattern(haystack, pattern) for pattern in patterns):
            return title
    return FALLBACK_TITLE


def compact_title(finding: Finding) -> str:
    source = normalize_title_source(finding.fix or finding.scenario)
    title = first_clause(source)
    if title and len(title) <= MAX_DIRECT_TITLE_LENGTH:
        return title
    return category_title(finding)

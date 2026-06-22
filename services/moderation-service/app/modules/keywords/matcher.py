import logging
import re
from collections.abc import Iterable
from dataclasses import dataclass

from app.db.models import Keyword
from app.modules.keywords.morphology import YO_TO_E, normalize_for_keyword_match

logger = logging.getLogger(__name__)

WORD_CHARS_PATTERN = r"[a-zA-Z0-9_\u0400-\u04FF]"
WORD_CHAR_RE = re.compile(WORD_CHARS_PATTERN)


@dataclass(frozen=True)
class KeywordCandidate:
    word: str
    patterns: tuple[re.Pattern[str], ...]


def build_match_pattern(escaped_keyword: str, normalized_word: str, is_phrase: bool) -> str:
    starts_with_word_char = bool(WORD_CHAR_RE.match(normalized_word[0]))
    ends_with_word_char = bool(WORD_CHAR_RE.match(normalized_word[-1]))
    boundary_start = f"(?<!{WORD_CHARS_PATTERN})" if starts_with_word_char else ""
    boundary_end = f"(?!{WORD_CHARS_PATTERN})" if ends_with_word_char else ""
    return f"{boundary_start}{escaped_keyword}{boundary_end}"


def build_keyword_candidates(keywords: Iterable[Keyword]) -> list[KeywordCandidate]:
    candidates: list[KeywordCandidate] = []
    for keyword in keywords:
        forms = {normalize_for_keyword_match(keyword.word)}
        for form_obj in getattr(keyword, "keyword_forms", []) or []:
            form = normalize_for_keyword_match(form_obj.form)
            if form:
                forms.add(form)
        patterns = tuple(
            re.compile(
                build_match_pattern(re.escape(form), form, keyword.is_phrase),
                re.IGNORECASE,
            )
            for form in forms
            if form
        )
        if patterns:
            candidates.append(KeywordCandidate(word=keyword.word, patterns=patterns))
    logger.debug("Built keyword candidates: count=%d", len(candidates))
    return candidates


def match_keyword_candidates(candidates: Iterable[KeywordCandidate], text: str | None) -> list[str]:
    normalized_text = normalize_for_keyword_match(text)
    if not normalized_text:
        logger.debug("Keyword match skipped: empty normalized text")
        return []
    matched: set[str] = set()
    for candidate in candidates:
        for pattern in candidate.patterns:
            if pattern.search(normalized_text):
                m = pattern.search(text) if text else None
                if m:
                    matched.add(m.group())
                else:
                    text_yo = text.translate(YO_TO_E) if text else None
                    m2 = pattern.search(text_yo) if text_yo else None
                    if m2:
                        matched.add(m2.group())
                    else:
                        matched.add(candidate.word)
                break
    logger.debug("Keyword match completed: matched_count=%d", len(matched))
    return sorted(matched)


class KeywordMatcher:
    def __init__(self, candidates: Iterable[KeywordCandidate]):
        self.candidates = tuple(candidates)

    def match_text(self, text: str | None) -> list[str]:
        return match_keyword_candidates(self.candidates, text)

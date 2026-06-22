import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.keywords.matcher import build_keyword_candidates, match_keyword_candidates


def keyword(word, *, forms=None, is_phrase=False):
    return SimpleNamespace(
        word=word,
        is_phrase=is_phrase,
        keyword_forms=[SimpleNamespace(form=form) for form in (forms or [])],
    )


def test_keyword_matcher_handles_punctuation_and_forms():
    candidates = build_keyword_candidates([keyword("опасно", forms=["опасная"])])

    assert match_keyword_candidates(candidates, "Опасная, ситуация.") == ["опасно"]
    assert match_keyword_candidates(candidates, "безопасная ситуация") == []


def test_keyword_matcher_returns_empty_for_empty_text():
    candidates = build_keyword_candidates([keyword("опасно")])

    assert match_keyword_candidates(candidates, None) == []
    assert match_keyword_candidates(candidates, "") == []


def test_keyword_matcher_uses_configured_keywords_without_active_flag():
    configured_keyword = keyword("экстремизм")

    assert not hasattr(configured_keyword, "active")
    assert match_keyword_candidates(
        build_keyword_candidates([configured_keyword]),
        "сообщение про экстремизм",
    ) == ["экстремизм"]

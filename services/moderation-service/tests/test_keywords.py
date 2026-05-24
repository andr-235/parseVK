import sys
import pytest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path
use_service_path()

from app.modules.keywords.morphology import normalize_for_keyword_match, KeywordMorphologyService
from app.modules.keywords.recalculation import build_match_pattern


def test_normalization():
    # Проверяем приведение к нижнему регистру и ё -> е
    assert normalize_for_keyword_match("Привет Ёлка!") == "привет елка!"
    
    # Проверяем неразрывные и множественные пробелы
    assert normalize_for_keyword_match("слово\u00a0\u00a0еще   одно") == "слово еще одно"
    
    # Проверяем мягкие переносы
    assert normalize_for_keyword_match("сло\u00adво") == "слово"
    
    # Проверяем None и пустоту
    assert normalize_for_keyword_match(None) == ""
    assert normalize_for_keyword_match("") == ""


@pytest.mark.anyio
async def test_morphology_generation():
    service = KeywordMorphologyService()
    
    # Проверка фразы (должно вернуть только нормализованную фразу)
    phrase_forms = await service.generate_forms("Черная кошка", is_phrase=True)
    assert phrase_forms == ["черная кошка"]
    
    # Проверка одиночного слова
    word_forms = await service.generate_forms("кошка", is_phrase=False)
    # pymorphy3 сгенерирует формы: кошка, кошки, кошке, кошку, кошкой, кошке, кошек, кошкам, кошками, кошках
    assert "кошка" in word_forms
    assert "кошки" in word_forms
    assert "кошку" in word_forms
    assert len(word_forms) > 3


def test_build_match_pattern():
    # Проверка одиночного слова (поиск по началу с границей)
    pattern_word = build_match_pattern("тест", "тест", is_phrase=False)
    assert "teст" not in pattern_word
    assert pattern_word.startswith("(?<![a-zA-Z0-9_\\u0400-\\u04FF])")
    assert not pattern_word.endswith("(?![a-zA-Z0-9_\\u0400-\\u04FF])")

    # Проверка фразы (поиск по полному совпадению с границами с обоих сторон)
    pattern_phrase = build_match_pattern("черная кошка", "черная кошка", is_phrase=True)
    assert pattern_phrase.startswith("(?<![a-zA-Z0-9_\\u0400-\\u04FF])")
    assert pattern_phrase.endswith("(?![a-zA-Z0-9_\\u0400-\\u04FF])")

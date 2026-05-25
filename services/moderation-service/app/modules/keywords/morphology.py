import re
import pymorphy3

# Регулярные выражения для нормализации
YO_TO_E = str.maketrans("ё", "е")


def normalize_for_keyword_match(value: str | None) -> str:
    if not value:
        return ""

    # Приводим к нижнему регистру
    val = value.lower()
    # Заменяем неразрывные пробелы (\u00a0) и невидимые пробелы на обычные
    val = re.sub(r"[\u00a0\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]", " ", val)
    # Удаляем мягкие переносы (\u00ad)
    val = val.replace("\u00ad", "")
    # Заменяем 'ё' на 'е'
    val = val.translate(YO_TO_E)
    # Нормализуем множественные пробелы в один
    val = re.sub(r"\s+", " ", val)
    # Обрезаем пробелы
    return val.strip()


class KeywordMorphologyService:
    def __init__(self):
        self.morph = pymorphy3.MorphAnalyzer()

    async def generate_forms(self, word: str, is_phrase: bool = False) -> list[str]:
        normalized_word = normalize_for_keyword_match(word)

        if not normalized_word:
            return []

        if is_phrase:
            return [normalized_word]

        # Для одиночных слов генерируем формы
        parses = self.morph.parse(normalized_word)
        if not parses:
            return [normalized_word]

        forms = {normalized_word}

        # Берем до 3 первых вариантов разбора слова (для многозначных слов)
        for parse in parses[:3]:
            # Добавляем нормальную форму слова
            if parse.normal_form:
                normal_normalized = normalize_for_keyword_match(parse.normal_form)
                if normal_normalized:
                    forms.add(normal_normalized)

            # Получаем все грамматические формы слова из лексемы словаря
            try:
                lexeme = parse.lexeme
                if lexeme:
                    for item in lexeme:
                        item_normalized = normalize_for_keyword_match(item.word)
                        if item_normalized:
                            forms.add(item_normalized)
            except Exception:
                pass

        # Возвращаем отсортированный по алфавиту список уникальных форм
        return sorted(list(forms))

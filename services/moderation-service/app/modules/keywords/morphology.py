<<<<<<< HEAD
import re
import logging
=======
import logging
import re

>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
import pymorphy3

logger = logging.getLogger(__name__)

YO_TO_E = str.maketrans("ё", "е")

ADJECTIVE_SHORT_FORM_SETS = [
    {'ADJS', 'sing', 'masc'},
    {'ADJS', 'sing', 'femn'},
    {'ADJS', 'sing', 'neut'},
    {'ADJS', 'plur'},
]
ADJECTIVE_COMPARATIVE_SET = {'COMP'}


def normalize_for_keyword_match(value: str | None) -> str:
    if not value:
        return ""

    val = value.lower()
    val = re.sub(r"[\u00a0\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]", " ", val)
    val = val.replace("\u00ad", "")
    val = val.translate(YO_TO_E)
    val = re.sub(r"\s+", " ", val)
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

        parses = self.morph.parse(normalized_word)
        if not parses:
            return [normalized_word]

        forms: set[str] = {normalized_word}

        for parse in parses:
            if parse.normal_form:
                nf = normalize_for_keyword_match(parse.normal_form)
                if nf:
                    forms.add(nf)

            try:
                lexeme = parse.lexeme
                if lexeme:
                    for item in lexeme:
                        nf = normalize_for_keyword_match(item.word)
                        if nf:
                            forms.add(nf)
            except Exception:
                logger.warning("Failed to get lexeme for '%s' (parse: %s)", word, parse.word, exc_info=True)

            if 'ADJF' in parse.tag:
                for gram_set in ADJECTIVE_SHORT_FORM_SETS:
                    try:
                        inflected = parse.inflect(gram_set)
                        if inflected:
                            nf = normalize_for_keyword_match(inflected.word)
                            if nf:
                                forms.add(nf)
                    except Exception:
                        logger.debug("Failed to inflect '%s' to %s", word, gram_set, exc_info=True)

                try:
                    comp = parse.inflect(ADJECTIVE_COMPARATIVE_SET)
                    if comp:
                        nf = normalize_for_keyword_match(comp.word)
                        if nf:
                            forms.add(nf)
                except Exception:
                    logger.debug("Failed to inflect '%s' to COMP", word, exc_info=True)

        return sorted(forms)

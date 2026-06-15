const NON_BREAKING_SPACE_REGEX = /\u00a0/g;
const SOFT_HYPHEN_REGEX = /\u00ad/g;
const INVISIBLE_SPACE_REGEX = /[\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]/g;
const MULTIPLE_WHITESPACE_REGEX = /\s+/g;
const YO_TO_E_REGEX = /ё/g;
export const WORD_CHARS_PATTERN = '[a-zA-Z0-9_\\u0400-\\u04FF]';
const WORD_CHAR_TEST = new RegExp(WORD_CHARS_PATTERN);
export function normalizeForKeywordMatch(value) {
    if (!value) {
        return '';
    }
    return value
        .toLowerCase()
        .replace(NON_BREAKING_SPACE_REGEX, ' ')
        .replace(INVISIBLE_SPACE_REGEX, ' ')
        .replace(SOFT_HYPHEN_REGEX, '')
        .replace(YO_TO_E_REGEX, 'е')
        .replace(MULTIPLE_WHITESPACE_REGEX, ' ')
        .trim();
}
export function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function matchesKeyword(text, keyword) {
    return getCandidateForms(keyword).some((form) => {
        const escaped = escapeRegExp(form);
        const pattern = buildMatchPattern(escaped, form, keyword.isPhrase);
        const regex = new RegExp(pattern, 'i');
        return regex.test(text);
    });
}
export function buildKeywordMatchCandidate(keyword) {
    const normalizedForms = Array.from(new Set([keyword.word, ...(keyword.keywordForms?.map((form) => form.form) ?? [])]
        .map((value) => normalizeForKeywordMatch(value))
        .filter((value) => Boolean(value))));
    if (normalizedForms.length === 0) {
        return null;
    }
    return {
        id: keyword.id,
        isPhrase: keyword.isPhrase,
        normalizedWord: normalizedForms[0],
        normalizedForms,
    };
}
export function buildKeywordMatchCandidates(keywords) {
    return keywords
        .map((keyword) => buildKeywordMatchCandidate(keyword))
        .filter((keyword) => keyword !== null);
}
function buildMatchPattern(escapedKeyword, normalizedWord, isPhrase) {
    const startsWithWordChar = WORD_CHAR_TEST.test(normalizedWord[0]);
    const endsWithWordChar = WORD_CHAR_TEST.test(normalizedWord[normalizedWord.length - 1]);
    const boundaryStart = startsWithWordChar ? `(?<!${WORD_CHARS_PATTERN})` : '';
    const boundaryEnd = endsWithWordChar ? `(?!${WORD_CHARS_PATTERN})` : '';
    if (isPhrase) {
        return `${boundaryStart}${escapedKeyword}${boundaryEnd}`;
    }
    return `${boundaryStart}${escapedKeyword}`;
}
function getCandidateForms(keyword) {
    if (keyword.normalizedForms?.length) {
        return keyword.normalizedForms;
    }
    return keyword.normalizedWord ? [keyword.normalizedWord] : [];
}
//# sourceMappingURL=keyword-normalization.utils.js.map
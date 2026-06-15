import { Engine, Gender, Case } from 'russian-nouns-js';
import { normalizeForKeywordMatch } from './keyword-normalization.utils.js';
const rne = new Engine();
const MIN_WORD_LENGTH = 2;
const SPECIAL_CHARS_REGEX = /[.\-_]/g;
const CYRILLIC_ONLY_REGEX = /^[а-яё]+$/i;
function isDeclinableWord(word) {
    if (word.length < MIN_WORD_LENGTH) {
        return false;
    }
    if (SPECIAL_CHARS_REGEX.test(word)) {
        return false;
    }
    return CYRILLIC_ONLY_REGEX.test(word);
}
const MIN_STEM_LENGTH = 3;
const MAX_LENGTH_DIFF = 3;
const MIN_LENGTH_DIFF = 2;
function isValidDeclinedForm(original, declined) {
    if (declined === original) {
        return true;
    }
    const lengthDiff = original.length - declined.length;
    if (lengthDiff > MAX_LENGTH_DIFF || lengthDiff < -MIN_LENGTH_DIFF) {
        return false;
    }
    const minStemLength = Math.min(original.length - 1, MIN_STEM_LENGTH);
    const originalStem = original.slice(0, minStemLength).toLowerCase();
    return declined.toLowerCase().startsWith(originalStem);
}
function processDeclinedForm(original, declinedForm, allForms) {
    if (!declinedForm) {
        return;
    }
    if (typeof declinedForm === 'string') {
        addValidForm(original, declinedForm, allForms);
    }
    else if (Array.isArray(declinedForm)) {
        for (const form of declinedForm) {
            if (typeof form === 'string' && form) {
                addValidForm(original, form, allForms);
            }
        }
    }
}
function addValidForm(original, form, allForms) {
    const normalizedForm = normalizeForKeywordMatch(form);
    if (normalizedForm && isValidDeclinedForm(original, normalizedForm)) {
        allForms.add(normalizedForm);
    }
}
const GRAMMATICAL_CASES = [
    Case.NOMINATIVE,
    Case.GENITIVE,
    Case.DATIVE,
    Case.ACCUSATIVE,
    Case.INSTRUMENTAL,
    Case.PREPOSITIONAL,
];
const GENDERS = [Gender.MASCULINE, Gender.FEMININE, Gender.NEUTER];
function generateDeclensionsForGender(normalized, gender, allForms) {
    try {
        const word = { text: normalized, gender };
        for (const grammaticalCase of GRAMMATICAL_CASES) {
            try {
                const declinedForm = rne.decline(word, grammaticalCase);
                processDeclinedForm(normalized, declinedForm, allForms);
            }
            catch {
                continue;
            }
        }
    }
    catch {
    }
}
export function generateAllWordForms(keyword) {
    const trimmed = keyword.trim();
    if (!trimmed) {
        return [];
    }
    const normalized = normalizeForKeywordMatch(trimmed);
    if (!normalized) {
        return [];
    }
    const allForms = new Set([normalized]);
    if (!isDeclinableWord(normalized)) {
        return Array.from(allForms);
    }
    for (const gender of GENDERS) {
        generateDeclensionsForGender(normalized, gender, allForms);
    }
    return Array.from(allForms);
}
//# sourceMappingURL=russian-nouns.utils.js.map
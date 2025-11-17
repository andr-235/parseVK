import { Engine, Gender, Case } from 'russian-nouns-js';

const NBSP_REGEX = /\u00a0/g;
const SOFT_HYPHEN_REGEX = /\u00ad/g;
const INVISIBLE_SPACE_REGEX = /[\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]/g;
const WHITESPACE_REGEX = /\s+/g;

const normalizeForKeywordMatch = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .replace(NBSP_REGEX, ' ')
    .replace(INVISIBLE_SPACE_REGEX, ' ')
    .replace(SOFT_HYPHEN_REGEX, '')
    .replace(/ё/g, 'е')
    .replace(WHITESPACE_REGEX, ' ')
    .trim();
};

const rne = new Engine();

const isDeclinableWord = (word: string): boolean => {
  if (word.length < 2) {
    return false;
  }

  if (/[\.\-_]/g.test(word)) {
    return false;
  }

  if (!/^[а-яё]+$/i.test(word)) {
    return false;
  }

  return true;
};

const isValidDeclinedForm = (original: string, declined: string): boolean => {
  if (declined === original) {
    return true;
  }

  if (declined.length < original.length - 2 || declined.length > original.length + 3) {
    return false;
  }

  const minStemLength = Math.min(original.length - 1, 3);
  const originalStem = original.slice(0, minStemLength);
  if (!declined.toLowerCase().startsWith(originalStem.toLowerCase())) {
    return false;
  }

  return true;
};

export function generateAllWordForms(keyword: string): string[] {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return [];
  }

  const normalized = normalizeForKeywordMatch(trimmed);
  if (!normalized) {
    return [];
  }

  const allForms = new Set<string>();
  allForms.add(normalized);

  if (!isDeclinableWord(normalized)) {
    return Array.from(allForms);
  }

  const genders = [Gender.MASCULINE, Gender.FEMININE, Gender.NEUTER];
  const cases = [
    Case.NOMINATIVE,
    Case.GENITIVE,
    Case.DATIVE,
    Case.ACCUSATIVE,
    Case.INSTRUMENTAL,
    Case.PREPOSITIONAL,
  ];

  for (const gender of genders) {
    try {
      const word = { text: normalized, gender };

      for (const grammaticalCase of cases) {
        try {
          const declinedForm = rne.decline(word, grammaticalCase);
          if (declinedForm && typeof declinedForm === 'string') {
            const normalizedForm = normalizeForKeywordMatch(declinedForm);
            if (normalizedForm && isValidDeclinedForm(normalized, normalizedForm)) {
              allForms.add(normalizedForm);
            }
          } else if (Array.isArray(declinedForm)) {
            for (const form of declinedForm) {
              if (typeof form === 'string' && form) {
                const normalizedForm = normalizeForKeywordMatch(form);
                if (normalizedForm && isValidDeclinedForm(normalized, normalizedForm)) {
                  allForms.add(normalizedForm);
                }
              }
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  return Array.from(allForms);
}


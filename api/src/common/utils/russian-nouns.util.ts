import { Engine, Gender } from 'russian-nouns-js';

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

  const genders = [Gender.MASCULINE, Gender.FEMININE, Gender.NEUTER];

  for (const gender of genders) {
    try {
      const word = { text: normalized, gender };
      const forms = rne.getAllForms(word);

      if (forms && typeof forms === 'object') {
        for (const numberKey of Object.keys(forms)) {
          const numberForms = forms[numberKey as keyof typeof forms];
          if (numberForms && typeof numberForms === 'object') {
            for (const caseKey of Object.keys(numberForms)) {
              const caseForm = numberForms[caseKey as keyof typeof numberForms];
              if (typeof caseForm === 'string' && caseForm) {
                const normalizedForm = normalizeForKeywordMatch(caseForm);
                if (normalizedForm) {
                  allForms.add(normalizedForm);
                }
              } else if (Array.isArray(caseForm)) {
                for (const form of caseForm) {
                  if (typeof form === 'string' && form) {
                    const normalizedForm = normalizeForKeywordMatch(form);
                    if (normalizedForm) {
                      allForms.add(normalizedForm);
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      continue;
    }
  }

  return Array.from(allForms);
}


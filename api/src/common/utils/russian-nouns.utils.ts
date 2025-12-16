import { Engine, Gender, Case } from 'russian-nouns-js';
import { normalizeForKeywordMatch } from './keyword-normalization.utils';

const rne = new Engine();

const MIN_WORD_LENGTH = 2;
const SPECIAL_CHARS_REGEX = /[.\-_]/g;
const CYRILLIC_ONLY_REGEX = /^[а-яё]+$/i;

/**
 * Проверяет, может ли слово быть склонено
 *
 * @param word - Слово для проверки
 * @returns true, если слово может быть склонено
 */
function isDeclinableWord(word: string): boolean {
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

/**
 * Проверяет, является ли склоненная форма валидной
 *
 * @param original - Исходное слово
 * @param declined - Склоненная форма
 * @returns true, если форма валидна
 */
function isValidDeclinedForm(original: string, declined: string): boolean {
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

/**
 * Обрабатывает склоненную форму и добавляет её в набор, если она валидна
 *
 * @param original - Исходное нормализованное слово
 * @param declinedForm - Склоненная форма (строка или массив строк)
 * @param allForms - Набор для добавления валидных форм
 */
function processDeclinedForm(
  original: string,
  declinedForm: string | string[] | null,
  allForms: Set<string>,
): void {
  if (!declinedForm) {
    return;
  }

  if (typeof declinedForm === 'string') {
    addValidForm(original, declinedForm, allForms);
  } else if (Array.isArray(declinedForm)) {
    for (const form of declinedForm) {
      if (typeof form === 'string' && form) {
        addValidForm(original, form, allForms);
      }
    }
  }
}

/**
 * Добавляет валидную нормализованную форму в набор
 *
 * @param original - Исходное нормализованное слово
 * @param form - Форма для проверки и добавления
 * @param allForms - Набор для добавления валидных форм
 */
function addValidForm(
  original: string,
  form: string,
  allForms: Set<string>,
): void {
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
] as const;

const GENDERS = [Gender.MASCULINE, Gender.FEMININE, Gender.NEUTER] as const;

/**
 * Генерирует все склонения для слова с указанным родом
 *
 * @param normalized - Нормализованное слово
 * @param gender - Род слова
 * @param allForms - Набор для добавления валидных форм
 */
function generateDeclensionsForGender(
  normalized: string,
  gender: Gender,
  allForms: Set<string>,
): void {
  try {
    const word = { text: normalized, gender };

    for (const grammaticalCase of GRAMMATICAL_CASES) {
      try {
        const declinedForm = rne.decline(word, grammaticalCase);
        processDeclinedForm(normalized, declinedForm, allForms);
      } catch {
        // Игнорируем ошибки склонения для конкретного падежа
        continue;
      }
    }
  } catch {
    // Игнорируем ошибки склонения для данного рода
  }
}

/**
 * Генерирует все возможные формы слова (склонения)
 *
 * Использует библиотеку russian-nouns-js для склонения русских слов
 * по всем падежам и родам, затем нормализует полученные формы.
 *
 * @param keyword - Ключевое слово для генерации форм
 * @returns Массив всех возможных форм слова
 */
export function generateAllWordForms(keyword: string): string[] {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return [];
  }

  const normalized = normalizeForKeywordMatch(trimmed);
  if (!normalized) {
    return [];
  }

  const allForms = new Set<string>([normalized]);

  if (!isDeclinableWord(normalized)) {
    return Array.from(allForms);
  }

  for (const gender of GENDERS) {
    generateDeclensionsForGender(normalized, gender, allForms);
  }

  return Array.from(allForms);
}

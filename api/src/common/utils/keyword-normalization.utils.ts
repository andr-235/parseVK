/**
 * Утилиты для нормализации и сопоставления ключевых слов
 *
 * Используются для приведения текста к единому формату перед поиском ключевых слов
 * и для проверки совпадений с учетом границ слов.
 */

// Регулярные выражения для нормализации текста
const NON_BREAKING_SPACE_REGEX = /\u00a0/g;
const SOFT_HYPHEN_REGEX = /\u00ad/g;
const INVISIBLE_SPACE_REGEX = /[\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]/g;
const MULTIPLE_WHITESPACE_REGEX = /\s+/g;
const YO_TO_E_REGEX = /ё/g;

// Определяем символы, которые считаются частью слова (латиница, кириллица, цифры, подчеркивание)
export const WORD_CHARS_PATTERN = '[a-zA-Z0-9_\\u0400-\\u04FF]';
const WORD_CHAR_TEST = new RegExp(WORD_CHARS_PATTERN);

export interface KeywordMatchCandidate {
  id: number;
  normalizedWord: string;
  isPhrase: boolean;
}

/**
 * Нормализует текст для сопоставления с ключевыми словами
 *
 * Выполняет следующие преобразования:
 * - Приводит к нижнему регистру
 * - Заменяет неразрывные пробелы и невидимые пробелы на обычные
 * - Удаляет мягкие переносы
 * - Заменяет 'ё' на 'е'
 * - Нормализует множественные пробелы в один
 * - Удаляет пробелы в начале и конце
 *
 * @param value - Текст для нормализации
 * @returns Нормализованный текст или пустая строка
 */
export function normalizeForKeywordMatch(
  value: string | null | undefined,
): string {
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

/**
 * Экранирует специальные символы для использования в регулярных выражениях
 *
 * @param value - Строка для экранирования
 * @returns Экранированная строка
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Проверяет, соответствует ли текст ключевому слову
 *
 * Учитывает границы слов для точного сопоставления:
 * - Для фраз проверяет полное совпадение с границами
 * - Для слов проверяет начало слова с границей
 *
 * @param text - Нормализованный текст для проверки
 * @param keyword - Ключевое слово для сопоставления
 * @returns true, если текст соответствует ключевому слову
 */
export function matchesKeyword(
  text: string,
  keyword: KeywordMatchCandidate,
): boolean {
  const escaped = escapeRegExp(keyword.normalizedWord);
  const pattern = buildMatchPattern(escaped, keyword);
  const regex = new RegExp(pattern, 'i');
  return regex.test(text);
}

/**
 * Строит паттерн регулярного выражения для сопоставления ключевого слова
 *
 * @param escapedKeyword - Экранированное ключевое слово
 * @param keyword - Ключевое слово с метаданными
 * @returns Паттерн регулярного выражения
 */
function buildMatchPattern(
  escapedKeyword: string,
  keyword: KeywordMatchCandidate,
): string {
  const normalizedWord = keyword.normalizedWord;
  const startsWithWordChar = WORD_CHAR_TEST.test(normalizedWord[0]);
  const endsWithWordChar = WORD_CHAR_TEST.test(
    normalizedWord[normalizedWord.length - 1],
  );

  const boundaryStart = startsWithWordChar ? `(?<!${WORD_CHARS_PATTERN})` : '';
  const boundaryEnd = endsWithWordChar ? `(?!${WORD_CHARS_PATTERN})` : '';

  if (keyword.isPhrase) {
    return `${boundaryStart}${escapedKeyword}${boundaryEnd}`;
  }
  return `${boundaryStart}${escapedKeyword}`;
}

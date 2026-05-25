const WHITESPACE_REGEX = /\s+/g
const NBSP_REGEX = /\u00a0/g
const SOFT_HYPHEN_REGEX = /\u00ad/g
const INVISIBLE_SPACE_REGEX = /[\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]/g
const YO_REGEX = /[ё]/g
const YE_REGEX = /[её]/gi

// Определяем символы, которые считаются частью слова (латиница, кириллица, цифры, подчеркивание)
const WORD_CHARS_PATTERN = '[a-zA-Z0-9_\\u0400-\\u04FF]'
const WORD_CHAR_TEST = new RegExp(WORD_CHARS_PATTERN)

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const normalizeForKeywordMatch = (value: string | null | undefined): string => {
  if (!value) {
    return ''
  }

  return value
    .toLowerCase()
    .replace(NBSP_REGEX, ' ')
    .replace(INVISIBLE_SPACE_REGEX, ' ')
    .replace(SOFT_HYPHEN_REGEX, '')
    .replace(YO_REGEX, 'е')
    .replace(WHITESPACE_REGEX, ' ')
    .trim()
}

export const buildKeywordPattern = (value: string, isPhrase: boolean = false): string => {
  const escaped = escapeRegExp(value)
  const withYe = escaped.replace(YE_REGEX, '[её]')

  // Проверяем, начинается/заканчивается ли ключевое слово с символа слова
  // Это нужно для корректной расстановки границ
  const startsWithWordChar = WORD_CHAR_TEST.test(value[0])
  const endsWithWordChar = WORD_CHAR_TEST.test(value[value.length - 1])

  // Используем Lookbehind (?<!) и Lookahead (?!), чтобы избежать проблем с кириллицей,
  // так как стандартный \b в JS работает некорректно с не-ASCII символами
  const boundaryStart = startsWithWordChar ? `(?<!${WORD_CHARS_PATTERN})` : ''
  const boundaryEnd = endsWithWordChar ? `(?!${WORD_CHARS_PATTERN})` : ''

  if (isPhrase) {
    return `${boundaryStart}${withYe}${boundaryEnd}`
  } else {
    return `${boundaryStart}${withYe}`
  }
}

import { generateAllWordForms } from './russianNounsUtils'

const WHITESPACE_REGEX = /\s+/g
const NBSP_REGEX = /\u00a0/g
const SOFT_HYPHEN_REGEX = /\u00ad/g
const INVISIBLE_SPACE_REGEX = /[\u2000-\u200f\u2028\u2029\u202f\u205f\u3000]/g
const YO_REGEX = /[ё]/g
const YE_REGEX = /[её]/gi

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

export const buildKeywordPattern = (value: string): string => {
  const escaped = escapeRegExp(value)
  return escaped.replace(YE_REGEX, '[её]')
}

export const buildKeywordPatternWithDeclensions = (value: string): string => {
  const forms = generateAllWordForms(value)
  
  if (forms.length === 0) {
    return buildKeywordPattern(value)
  }

  const patterns = forms.map((form: string) => {
    const escaped = escapeRegExp(form)
    return escaped.replace(YE_REGEX, '[её]')
  })

  return `(?:${patterns.join('|')})`
}

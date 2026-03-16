import type { Keyword } from '@/types'
import { normalizeForKeywordMatch } from '@/shared/utils/keywordMatching'

export function getMatchedKeywordLabel(keyword: Keyword, text?: string | null): string {
  const baseWord = keyword.word.trim()
  if (!text) {
    return baseWord
  }

  const normalizedText = normalizeForKeywordMatch(text)
  if (!normalizedText) {
    return baseWord
  }

  const forms =
    Array.isArray(keyword.forms) && keyword.forms.length > 0 ? keyword.forms : [baseWord]
  const sortedForms = [...forms].sort((left, right) => right.length - left.length)

  const matchedForm = sortedForms.find((form) => {
    const normalizedForm = normalizeForKeywordMatch(form)
    return normalizedForm.length > 0 && normalizedText.includes(normalizedForm)
  })

  if (!matchedForm) {
    return baseWord
  }

  const normalizedBase = normalizeForKeywordMatch(baseWord)
  const normalizedMatched = normalizeForKeywordMatch(matchedForm)

  if (normalizedBase === normalizedMatched) {
    return baseWord
  }

  return `${baseWord} / ${matchedForm}`
}

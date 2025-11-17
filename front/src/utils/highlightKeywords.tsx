import type { Keyword } from '../types'
import { buildKeywordPatternWithDeclensions, normalizeForKeywordMatch } from './keywordMatching'
import { generateAllWordForms } from './russianNounsUtils'

export function highlightKeywords(text: string, keywords: Keyword[]) {
  if (!text || keywords.length === 0) {
    return text
  }

  const keywordEntries = keywords
    .map((keyword) => {
      const trimmed = keyword.word.trim()
      const normalized = normalizeForKeywordMatch(trimmed)

      if (!normalized) {
        return null
      }

      const allForms = generateAllWordForms(trimmed)
      const normalizedForms = new Set(allForms.map((form) => normalizeForKeywordMatch(form)))

      return { original: trimmed, normalized, normalizedForms }
    })
    .filter((entry, index, array): entry is { original: string; normalized: string; normalizedForms: Set<string> } => {
      if (!entry) {
        return false
      }

      return array.findIndex((item) => item?.normalized === entry.normalized) === index
    })

  if (keywordEntries.length === 0) {
    return text
  }

  const patterns = keywordEntries.map((entry) => buildKeywordPatternWithDeclensions(entry.original))

  if (patterns.length === 0) {
    return text
  }

  const regex = new RegExp(`(${patterns.join('|')})`, 'gi')
  const allNormalizedForms = new Set<string>()
  keywordEntries.forEach((entry) => {
    entry.normalizedForms.forEach((form) => allNormalizedForms.add(form))
  })
  
  const parts = text.split(regex)

  return parts.map((part, index) => {
    const normalizedPart = normalizeForKeywordMatch(part)
    if (!allNormalizedForms.has(normalizedPart)) {
      return part
    }

    return (
      <span key={index} className="text-yellow-600 dark:text-yellow-300 font-semibold">
        {part}
      </span>
    )
  })
}

import type { Keyword } from '../types'
import { buildKeywordPattern, normalizeForKeywordMatch } from './keywordMatching'

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

      return { original: trimmed, normalized }
    })
    .filter(
      (
        entry,
        index,
        array,
      ): entry is { original: string; normalized: string } =>
        Boolean(entry) && array.findIndex((item) => item?.normalized === entry.normalized) === index,
    )

  if (keywordEntries.length === 0) {
    return text
  }

  const patterns = keywordEntries.map((entry) => buildKeywordPattern(entry.original))

  if (patterns.length === 0) {
    return text
  }

  const regex = new RegExp(`(${patterns.join('|')})`, 'gi')
  const normalizedKeywords = new Set(keywordEntries.map((entry) => entry.normalized))
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (!normalizedKeywords.has(normalizeForKeywordMatch(part))) {
      return part
    }

    return (
      <span key={index} className="text-yellow-600 dark:text-yellow-300 font-semibold">
        {part}
      </span>
    )
  })
}

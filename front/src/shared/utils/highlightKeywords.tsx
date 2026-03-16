import type { Keyword } from '@/shared/types'
import { buildKeywordPattern, normalizeForKeywordMatch } from '@/shared/utils/keywordMatching'

export function highlightKeywords(text: string, keywords: Keyword[]) {
  if (!text || keywords.length === 0) {
    return text
  }

  const keywordEntries = keywords
    .flatMap((keyword) => {
      const sourceForms =
        Array.isArray(keyword.forms) && keyword.forms.length > 0 ? keyword.forms : [keyword.word]

      return sourceForms.map((form) => {
        const trimmed = form.trim()
        const normalized = normalizeForKeywordMatch(trimmed)

        if (!normalized) {
          return null
        }

        return {
          original: trimmed,
          normalized,
          isPhrase: keyword.isPhrase ?? false,
        }
      })
    })
    .filter(
      (
        entry,
        index,
        array
      ): entry is {
        original: string
        normalized: string
        isPhrase: boolean
      } => {
        if (!entry) {
          return false
        }

        return (
          array.findIndex(
            (item) => item?.normalized === entry.normalized && item?.isPhrase === entry.isPhrase
          ) === index
        )
      }
    )

  if (keywordEntries.length === 0) {
    return text
  }

  const sortedKeywordEntries = [...keywordEntries].sort(
    (left, right) => right.original.length - left.original.length
  )

  const patterns = sortedKeywordEntries.map((entry) =>
    buildKeywordPattern(entry.original, entry.isPhrase)
  )

  if (patterns.length === 0) {
    return text
  }

  const regex = new RegExp(`(${patterns.join('|')})`, 'gi')
  const normalizedKeywords = new Set(sortedKeywordEntries.map((entry) => entry.normalized))

  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (!part) {
      return part
    }

    const normalizedPart = normalizeForKeywordMatch(part)

    if (normalizedKeywords.has(normalizedPart)) {
      return (
        <span key={index} className="text-yellow-600 dark:text-yellow-300 font-semibold">
          {part}
        </span>
      )
    }

    return part
  })
}

import type { Keyword } from '@/types'
import { buildKeywordPattern, normalizeForKeywordMatch } from '@/modules/comments/utils/keywordMatching'

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

      return {
        original: trimmed,
        normalized,
        isPhrase: keyword.isPhrase ?? false,
      }
    })
    .filter(
      (entry, index, array): entry is {
        original: string
        normalized: string
        isPhrase: boolean
      } => {
        if (!entry) {
          return false
        }

        return (
          array.findIndex(
            (item) =>
              item?.normalized === entry.normalized &&
              item?.isPhrase === entry.isPhrase,
          ) === index
        )
      },
    )

  if (keywordEntries.length === 0) {
    return text
  }

  const patterns = keywordEntries.map((entry) =>
    buildKeywordPattern(entry.original, entry.isPhrase),
  )

  if (patterns.length === 0) {
    return text
  }

  const regex = new RegExp(`(${patterns.join('|')})`, 'gi')
  
  const keywordPatternMap = new Map<string, RegExp>()
  keywordEntries.forEach((entry) => {
    const pattern = buildKeywordPattern(entry.original, entry.isPhrase)
    keywordPatternMap.set(entry.normalized, new RegExp(`^${pattern}$`, 'i'))
  })

  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (!part) {
      return part
    }
    
    for (const pattern of keywordPatternMap.values()) {
      if (pattern.test(part)) {
        return (
          <span key={index} className="text-yellow-600 dark:text-yellow-300 font-semibold">
            {part}
          </span>
        )
      }
    }

    return part
  })
}


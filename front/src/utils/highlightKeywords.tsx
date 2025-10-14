import type { Keyword } from '../types'

export function highlightKeywords(text: string, keywords: Keyword[]) {
  if (!text || keywords.length === 0) {
    return text
  }

  const keywordTexts = keywords
    .map((keyword) => keyword.word.trim())
    .filter((word, index, array) => word.length > 0 && array.indexOf(word) === index)

  if (keywordTexts.length === 0) {
    return text
  }

  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedKeywords = keywordTexts.map(escapeRegExp)
  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi')
  const normalizedKeywords = new Set(keywordTexts.map((word) => word.toLowerCase()))
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (!normalizedKeywords.has(part.toLowerCase())) {
      return part
    }

    return (
      <span key={index} className="text-yellow-600 dark:text-yellow-300 font-semibold">
        {part}
      </span>
    )
  })
}

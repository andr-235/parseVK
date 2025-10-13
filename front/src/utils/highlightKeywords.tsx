import type { Keyword } from '../types'

export function highlightKeywords(text: string, keywords: Keyword[]) {
  if (keywords.length === 0) return text

  const keywordTexts = keywords.map(k => k.word)
  const regex = new RegExp(`(${keywordTexts.join('|')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => {
    const isKeyword = keywordTexts.some(
      kw => kw.toLowerCase() === part.toLowerCase()
    )
    if (!isKeyword) {
      return part
    }

    return (
      <span
        key={index}
        className="text-yellow-600 dark:text-yellow-300 font-semibold"
      >
        {part}
      </span>
    )
  })
}

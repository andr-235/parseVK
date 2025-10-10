import type { Keyword } from '../types'
import { Badge } from '@/components/ui/badge'

export function highlightKeywords(text: string, keywords: Keyword[]) {
  if (keywords.length === 0) return text

  const keywordTexts = keywords.map(k => k.word)
  const regex = new RegExp(`(${keywordTexts.join('|')})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => {
    const isKeyword = keywordTexts.some(
      kw => kw.toLowerCase() === part.toLowerCase()
    )
    return isKeyword ? (
      <Badge key={index} variant="highlight" className="mx-0.5">{part}</Badge>
    ) : (
      part
    )
  })
}


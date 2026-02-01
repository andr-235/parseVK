import type { Keyword } from '@/types'
import { normalizeForKeywordMatch } from './keywordMatching'

type ResolveKeywordsParams = {
  matchedKeywords?: Keyword[]
  commentText?: string | null
  postText?: string | null
}

const isKeywordInText = (text: string | undefined, keyword: Keyword): boolean => {
  if (!text) return false
  const normalizedText = normalizeForKeywordMatch(text)
  const normalizedKeyword = normalizeForKeywordMatch(keyword.word)
  return normalizedText.includes(normalizedKeyword)
}

const uniqueById = <T extends { id: number }>(items: T[]): T[] =>
  items.filter((item, index, array) => array.findIndex((i) => i.id === item.id) === index)

export function resolveCommentKeywords({
  matchedKeywords = [],
  commentText,
  postText,
}: ResolveKeywordsParams) {
  const fromPost = uniqueById(
    matchedKeywords
      .filter((kw) => kw.source === 'POST')
      .filter((kw) => isKeywordInText(postText ?? undefined, kw))
  )

  const fromComment = uniqueById(
    matchedKeywords
      .filter((kw) => kw.source !== 'POST')
      .filter((kw) => isKeywordInText(commentText ?? undefined, kw))
  )

  const all = uniqueById([...fromPost, ...fromComment])

  return {
    fromPost,
    fromComment,
    all,
  }
}

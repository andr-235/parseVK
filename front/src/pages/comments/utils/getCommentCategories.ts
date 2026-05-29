import type { Keyword } from '@/types'

export function getCommentCategories(matchedKeywords: Keyword[] = []): string[] {
  return Array.from(
    new Set(matchedKeywords.map((keyword) => keyword.category?.trim()).filter(Boolean))
  ) as string[]
}

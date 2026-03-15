import type { Keyword, KeywordCategoryGroup } from '@/types'

export const UNCATEGORIZED_KEYWORD_LABEL = 'Без категории'

export function groupKeywordsByCategory(keywords: Keyword[]): KeywordCategoryGroup[] {
  const buckets = new Map<string, Keyword[]>()

  for (const keyword of keywords) {
    const bucket = keyword.category?.trim() || UNCATEGORIZED_KEYWORD_LABEL
    const existing = buckets.get(bucket)

    if (existing) {
      existing.push(keyword)
      continue
    }

    buckets.set(bucket, [keyword])
  }

  return Array.from(buckets.entries()).map(([category, items]) => ({
    category,
    keywords: items,
  }))
}

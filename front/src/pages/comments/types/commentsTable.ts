import type { Comment, Keyword } from '@/shared/types'

export interface CategorizedComment {
  comment: Comment
  matchedKeywords: Keyword[]
  categories: string[]
}

export interface CategorizedGroup {
  category: string
  comments: CategorizedComment[]
}

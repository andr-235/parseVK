import type { Comment, Keyword } from '@/types'

export interface CategorizedComment {
  comment: Comment
  matchedKeywords: Keyword[]
}

export interface CategorizedGroup {
  category: string
  comments: CategorizedComment[]
}

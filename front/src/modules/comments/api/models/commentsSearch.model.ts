import type { CommentsSearchViewMode } from '../dto/commentsSearch.dto'

export interface CommentsSearchCommentItem {
  type: 'comment'
  commentId: number
  postId: number | null
  commentText: string
  postText: string | null
  highlight: string[]
}

export interface CommentsSearchPostItem {
  type: 'post'
  postId: number
  postText: string | null
  comments: CommentsSearchCommentItem[]
}

export type CommentsSearchItem = CommentsSearchCommentItem | CommentsSearchPostItem

export interface CommentsSearchResult {
  source: 'elasticsearch' | 'fallback'
  viewMode: CommentsSearchViewMode
  total: number
  page: number
  pageSize: number
  items: CommentsSearchItem[]
}

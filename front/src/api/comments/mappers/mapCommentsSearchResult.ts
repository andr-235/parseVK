import type {
  CommentsSearchCommentItemDto,
  CommentsSearchPostItemDto,
  CommentsSearchResponseDto,
} from '../dto/commentsSearch.dto'
import type {
  CommentsSearchCommentItem,
  CommentsSearchPostItem,
  CommentsSearchResult,
} from '../models/commentsSearch.model'

const mapCommentItem = (item: CommentsSearchCommentItemDto): CommentsSearchCommentItem => ({
  type: 'comment',
  commentId: item.commentId,
  postId: item.postId,
  commentText: item.commentText,
  postText: item.postText,
  highlight: Array.isArray(item.highlight) ? item.highlight : [],
})

const mapPostItem = (item: CommentsSearchPostItemDto): CommentsSearchPostItem => ({
  type: 'post',
  postId: item.postId,
  postText: item.postText,
  comments: Array.isArray(item.comments) ? item.comments.map(mapCommentItem) : [],
})

export const mapCommentsSearchResult = (
  payload: CommentsSearchResponseDto
): CommentsSearchResult => ({
  source: payload.source,
  viewMode: payload.viewMode,
  total: payload.total,
  page: payload.page,
  pageSize: payload.pageSize,
  items: payload.items.map((item) =>
    item.type === 'post' ? mapPostItem(item) : mapCommentItem(item)
  ),
})

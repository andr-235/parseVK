import { create } from 'zustand'
import { commentsApi } from '../api/commentsApi'
import type { CommentsState } from '../types/stores'
import { normalizeCommentResponse, COMMENTS_PAGE_SIZE } from './commentsStore.utils'
import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/queries/queryKeys'

type CommentsQueryData = {
  comments: CommentsState['comments']
  nextCursor: string | null
  hasMore: boolean
  totalCount: number
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  totalCount: 0,
  nextCursor: null,

  async fetchComments({ reset = false, limit }: { reset?: boolean; limit?: number } = {}) {
    const state = get()

    if (reset ? state.isLoading : state.isLoadingMore || state.isLoading) {
      return
    }

    if (!reset && !state.hasMore) {
      return
    }

    const offset = reset ? 0 : state.comments.length
    const pageSize = typeof limit === 'number' && limit > 0 ? limit : COMMENTS_PAGE_SIZE

    if (reset) {
      set({ isLoading: true })
    } else {
      set({ isLoadingMore: true })
    }

    try {
      const response = await commentsApi.getComments({ offset, limit: pageSize })
      const normalized = response.items.map((comment) => normalizeCommentResponse(comment))

      set((prevState) => ({
        comments: reset ? normalized : [...prevState.comments, ...normalized],
        isLoading: false,
        isLoadingMore: false,
        hasMore: response.hasMore,
        totalCount: response.total
      }))

      queryClient.setQueryData<CommentsQueryData>(queryKeys.comments, (prev) => ({
        comments: reset ? normalized : [...(prev?.comments ?? []), ...normalized],
        nextCursor: null,
        hasMore: response.hasMore,
        totalCount: response.total
      }))
    } catch (error) {
      console.error('Failed to fetch comments', error)
      set({ isLoading: false, isLoadingMore: false })
      throw error
    }
  },

  /**
   * Cursor-based pagination (рекомендуется для больших списков)
   *
   * Преимущества:
   * - Быстрее на больших offset'ах (использует индекс)
   * - Нет проблемы "missing rows" при добавлении новых данных
   * - Стабильная пагинация при обновлениях данных
   */
  async fetchCommentsCursor({ reset = false, limit }: { reset?: boolean; limit?: number } = {}) {
    const state = get()

    if (reset ? state.isLoading : state.isLoadingMore || state.isLoading) {
      return
    }

    if (!reset && !state.hasMore) {
      return
    }

    const cursor = reset ? undefined : state.nextCursor ?? undefined
    const pageSize = typeof limit === 'number' && limit > 0 ? limit : COMMENTS_PAGE_SIZE

    if (reset) {
      set({ isLoading: true })
    } else {
      set({ isLoadingMore: true })
    }

    try {
      const response = await commentsApi.getCommentsCursor({ cursor, limit: pageSize })
      const normalized = response.items.map((comment) => normalizeCommentResponse(comment))

      set((prevState) => ({
        comments: reset ? normalized : [...prevState.comments, ...normalized],
        isLoading: false,
        isLoadingMore: false,
        hasMore: response.hasMore,
        totalCount: response.total,
        nextCursor: response.nextCursor
      }))

      queryClient.setQueryData<CommentsQueryData>(queryKeys.comments, (prev) => ({
        comments: reset ? normalized : [...(prev?.comments ?? []), ...normalized],
        nextCursor: response.nextCursor ?? null,
        hasMore: response.hasMore,
        totalCount: response.total
      }))
    } catch (error) {
      console.error('Failed to fetch comments with cursor', error)
      set({ isLoading: false, isLoadingMore: false })
      throw error
    }
  },

  async toggleReadStatus(id) {
    const currentComment = get().comments.find((comment) => comment.id === id)

    if (!currentComment) {
      console.warn(`Комментарий с id=${id} не найден в локальном сторе`)
      return
    }

    const nextIsRead = !currentComment.isRead

    set((state) => ({
      comments: state.comments.map((comment) =>
        comment.id === id ? { ...comment, isRead: nextIsRead } : comment
      )
    }))

    try {
      const updated = await commentsApi.updateReadStatus(id, nextIsRead)
      set((state) => ({
        comments: state.comments.map((comment) =>
          comment.id === id
            ? { ...comment, isRead: updated.isRead ?? nextIsRead }
            : comment
        )
      }))
    } catch (error) {
      set((state) => ({
        comments: state.comments.map((comment) =>
          comment.id === id ? { ...comment, isRead: !nextIsRead } : comment
        )
      }))
      console.error('Failed to update read status', error)
      throw error
    }
  },

  markWatchlisted(commentId, watchlistAuthorId) {
    set((state) => ({
      comments: state.comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, watchlistAuthorId, isWatchlisted: true }
          : comment
      )
    }))
  }
}))

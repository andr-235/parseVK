import { create } from 'zustand'
import { commentsService } from '@/services/commentsService'
import type { CommentsFilters, CommentsState } from '@/types/stores'
import { normalizeCommentResponse, COMMENTS_PAGE_SIZE } from './commentsStore.utils'
import { queryClient } from '@/lib/queryClient'
import { queryKeys } from '@/hooks/queryKeys'

// Синхронный флаг для предотвращения race condition
let isFetchingComments = false

// Счётчик и ID для защиты от race condition при reset запросах
let cursorRequestCounter = 0
let latestCursorRequestId = 0

type CommentsQueryData = {
  comments: CommentsState['comments']
  nextCursor: string | null
  hasMore: boolean
  totalCount: number
  readCount: number
  unreadCount: number
}

const normalizeFilters = (filters?: CommentsFilters): CommentsFilters => {
  const normalized: CommentsFilters = {
    readStatus: 'unread',
  }

  const rawStatus = filters?.readStatus?.toLowerCase()
  if (rawStatus === 'all' || rawStatus === 'read' || rawStatus === 'unread') {
    normalized.readStatus = rawStatus
  }

  const normalizedKeywords = filters?.keywords
    ?.map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0)

  if (normalizedKeywords && normalizedKeywords.length > 0) {
    normalized.keywords = Array.from(new Set(normalizedKeywords))
  }

  if (filters?.keywordSource === 'COMMENT' || filters?.keywordSource === 'POST') {
    normalized.keywordSource = filters.keywordSource
  }

  const normalizedSearch = filters?.search?.trim()
  if (normalizedSearch) {
    normalized.search = normalizedSearch
  }

  return normalized
}

const shouldRemoveAfterToggle = (filters: CommentsFilters, nextIsRead: boolean) => {
  if (filters.readStatus === 'unread' && nextIsRead) {
    return true
  }

  if (filters.readStatus === 'read' && !nextIsRead) {
    return true
  }

  return false
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  totalCount: 0,
  nextCursor: null,
  readCount: 0,
  unreadCount: 0,
  filters: normalizeFilters(),

  async fetchComments({
    reset = false,
    limit,
    filters,
  }: { reset?: boolean; limit?: number; filters?: CommentsFilters } = {}) {
    const state = get()

    if (reset ? state.isLoading : state.isLoadingMore || state.isLoading) {
      return
    }

    if (!reset && !state.hasMore) {
      return
    }

    const offset = reset ? 0 : state.comments.length
    const pageSize = typeof limit === 'number' && limit > 0 ? limit : COMMENTS_PAGE_SIZE
    const activeFilters = reset ? normalizeFilters(filters ?? state.filters) : state.filters

    if (reset) {
      set({ isLoading: true, filters: activeFilters })
    } else {
      set({ isLoadingMore: true })
    }

    try {
      const response = await commentsService.getComments({
        offset,
        limit: pageSize,
        keywords: activeFilters.keywords,
        keywordSource: activeFilters.keywordSource,
        readStatus: activeFilters.readStatus,
        search: activeFilters.search,
      })
      const normalized = Array.isArray(response.items)
        ? response.items.map((comment) => normalizeCommentResponse(comment))
        : []

      set((prevState) => ({
        comments: reset ? normalized : [...prevState.comments, ...normalized],
        isLoading: false,
        isLoadingMore: false,
        hasMore: response.hasMore,
        totalCount: response.total,
        readCount: response.readCount,
        unreadCount: response.unreadCount,
        filters: activeFilters,
      }))

      queryClient.setQueryData<CommentsQueryData>(queryKeys.comments, (prev) => ({
        comments: reset ? normalized : [...(prev?.comments ?? []), ...normalized],
        nextCursor: null,
        hasMore: response.hasMore,
        totalCount: response.total,
        readCount: response.readCount,
        unreadCount: response.unreadCount,
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
  async fetchCommentsCursor({
    reset = false,
    limit,
    filters,
  }: { reset?: boolean; limit?: number; filters?: CommentsFilters } = {}) {
    // Синхронная проверка для предотвращения race condition (только для loadMore)
    if (isFetchingComments && !reset) {
      return
    }

    const state = get()

    if (reset ? state.isLoading : state.isLoadingMore || state.isLoading) {
      return
    }

    if (!reset && !state.hasMore) {
      return
    }

    // Устанавливаем синхронный флаг
    isFetchingComments = true

    // Генерируем уникальный ID для этого запроса (защита от race condition при reset)
    const requestId = ++cursorRequestCounter
    if (reset) {
      latestCursorRequestId = requestId
    }

    const cursor = reset ? undefined : (state.nextCursor ?? undefined)
    const pageSize = typeof limit === 'number' && limit > 0 ? limit : COMMENTS_PAGE_SIZE
    const activeFilters = normalizeFilters(reset ? (filters ?? state.filters) : state.filters)

    if (reset) {
      set({ isLoading: true, filters: activeFilters })
    } else {
      set({ isLoadingMore: true })
    }

    try {
      const response = await commentsService.getCommentsCursor({
        cursor,
        limit: pageSize,
        keywords: activeFilters.keywords,
        keywordSource: activeFilters.keywordSource,
        readStatus: activeFilters.readStatus,
        search: activeFilters.search,
      })

      // Проверяем актуальность запроса (для reset запросов)
      if (reset && requestId !== latestCursorRequestId) {
        // Ответ устарел - более новый reset запрос уже отправлен
        return
      }

      const normalized = Array.isArray(response.items)
        ? response.items.map((comment) => normalizeCommentResponse(comment))
        : []

      set((prevState) => {
        const nextComments = reset ? normalized : [...prevState.comments, ...normalized]
        // Если все комментарии загружены, обновляем totalCount до фактического количества
        const finalTotalCount = response.hasMore
          ? response.total
          : Math.max(response.total, nextComments.length)

        return {
          comments: nextComments,
          isLoading: false,
          isLoadingMore: false,
          hasMore: response.hasMore,
          totalCount: finalTotalCount,
          nextCursor: response.nextCursor,
          readCount: response.readCount,
          unreadCount: response.unreadCount,
          filters: activeFilters,
        }
      })

      queryClient.setQueryData<CommentsQueryData>(queryKeys.comments, (prev) => {
        const nextComments = reset ? normalized : [...(prev?.comments ?? []), ...normalized]
        const finalTotalCount = response.hasMore
          ? response.total
          : Math.max(response.total, nextComments.length)

        return {
          comments: nextComments,
          nextCursor: response.nextCursor ?? null,
          hasMore: response.hasMore,
          totalCount: finalTotalCount,
          readCount: response.readCount,
          unreadCount: response.unreadCount,
        }
      })
    } catch (error) {
      // Проверяем актуальность запроса перед обработкой ошибки
      if (reset && requestId !== latestCursorRequestId) {
        return
      }
      console.error('Failed to fetch comments with cursor', error)
      set({ isLoading: false, isLoadingMore: false })
      throw error
    } finally {
      isFetchingComments = false
    }
  },

  async toggleReadStatus(id: number) {
    const state = get()
    const currentIndex = state.comments.findIndex((comment) => comment.id === id)
    const currentComment = currentIndex >= 0 ? state.comments[currentIndex] : undefined

    if (!currentComment) {
      console.warn(`Комментарий с id=${id} не найден в локальном сторе`)
      return
    }

    const nextIsRead = !currentComment.isRead
    const readDelta = nextIsRead ? 1 : -1
    const unreadDelta = -readDelta
    const shouldRemove = shouldRemoveAfterToggle(state.filters ?? normalizeFilters(), nextIsRead)

    set((state) => ({
      comments: state.comments
        .map((comment) => (comment.id === id ? { ...comment, isRead: nextIsRead } : comment))
        .filter((comment) => !(comment.id === id && shouldRemove)),
      readCount: Math.max(0, state.readCount + readDelta),
      unreadCount: Math.max(0, state.unreadCount + unreadDelta),
      totalCount: shouldRemove ? Math.max(0, state.totalCount - 1) : state.totalCount,
    }))

    try {
      const updated = await commentsService.updateReadStatus(id, nextIsRead)
      const finalIsRead = updated.isRead ?? nextIsRead

      if (finalIsRead !== nextIsRead) {
        const finalReadDelta = finalIsRead ? 1 : -1
        const finalUnreadDelta = -finalReadDelta
        const shouldRemoveFinal = shouldRemoveAfterToggle(
          state.filters ?? normalizeFilters(),
          finalIsRead
        )

        set((prevState) => {
          const baseComments = prevState.comments.filter((comment) => comment.id !== id)
          const restoredComment = { ...currentComment, isRead: finalIsRead }
          const nextComments = shouldRemoveFinal
            ? baseComments
            : (() => {
                const copy = [...baseComments]
                copy.splice(Math.min(currentIndex, copy.length), 0, restoredComment)
                return copy
              })()

          return {
            comments: nextComments,
            readCount: Math.max(0, prevState.readCount - readDelta + finalReadDelta),
            unreadCount: Math.max(0, prevState.unreadCount - unreadDelta + finalUnreadDelta),
            totalCount: shouldRemoveFinal
              ? Math.max(0, prevState.totalCount)
              : prevState.totalCount + (shouldRemove ? 1 : 0),
          }
        })
      }

      void get().fetchCommentsCursor({ reset: true, filters: state.filters })
    } catch (error) {
      set((prevState) => {
        const baseComments = prevState.comments.filter((comment) => comment.id !== id)
        const restoredComment = { ...currentComment }
        const nextComments = (() => {
          const copy = [...baseComments]
          copy.splice(Math.min(currentIndex, copy.length), 0, restoredComment)
          return copy
        })()

        return {
          comments: nextComments,
          readCount: Math.max(0, prevState.readCount - readDelta),
          unreadCount: Math.max(0, prevState.unreadCount - unreadDelta),
          totalCount: shouldRemove ? prevState.totalCount + 1 : prevState.totalCount,
        }
      })
      console.error('Failed to update read status', error)
      throw error
    }
  },

  markWatchlisted(commentId: number, watchlistAuthorId: number) {
    set((state) => ({
      comments: state.comments.map((comment) =>
        comment.id === commentId ? { ...comment, watchlistAuthorId, isWatchlisted: true } : comment
      ),
    }))
  },
}))

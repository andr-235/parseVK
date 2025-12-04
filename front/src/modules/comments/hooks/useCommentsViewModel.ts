import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCommentsStore, useKeywordsStore, useWatchlistStore } from '@/store'
import type { Comment, Keyword } from '@/types'

type ReadFilter = 'all' | 'unread' | 'read'
type CommentWithKeywords = { comment: Comment; matchedKeywords: Keyword[] }

const DEFAULT_CATEGORY = 'Без категории'

const getMatchedKeywords = (comment: Comment): Keyword[] => {
  const value = (comment as Partial<Comment> & { matchedKeywords?: Keyword[] }).matchedKeywords
  return Array.isArray(value) ? value : []
}

const buildCategoryMap = (matched: Keyword[]) =>
  matched.reduce((acc, keyword) => {
    const category = keyword.category?.trim() || DEFAULT_CATEGORY
    const items = acc.get(category)
    if (items) {
      if (!items.some((item) => item.id === keyword.id)) items.push(keyword)
    } else {
      acc.set(category, [keyword])
    }
    return acc
  }, new Map<string, Keyword[]>())

const groupComments = (comments: Comment[], indexMap: Map<number, number>) => {
  const commentsWithoutKeywords: CommentWithKeywords[] = []
  const groups = new Map<string, CommentWithKeywords[]>()

  comments.forEach((comment) => {
    const matched = getMatchedKeywords(comment)
    if (matched.length === 0) {
      commentsWithoutKeywords.push({ comment, matchedKeywords: matched })
      return
    }

    const categories = buildCategoryMap(matched)
    if (categories.size === 0) {
      commentsWithoutKeywords.push({ comment, matchedKeywords: matched })
      return
    }

    categories.forEach((categoryKeywords, categoryName) => {
      const payload: CommentWithKeywords = { comment, matchedKeywords: categoryKeywords }
      const items = groups.get(categoryName)
      if (items) {
        items.push(payload)
        return
      }
      groups.set(categoryName, [payload])
    })
  })

  const groupedComments = Array.from(groups.entries())
    .map(([category, commentsInGroup]) => ({
      category,
      comments: commentsInGroup.sort(
        (a, b) => (indexMap.get(a.comment.id) ?? 0) - (indexMap.get(b.comment.id) ?? 0)
      ),
    }))
    .sort((a, b) => {
      if (a.category === DEFAULT_CATEGORY && b.category !== DEFAULT_CATEGORY) return -1
      if (b.category === DEFAULT_CATEGORY && a.category !== DEFAULT_CATEGORY) return 1
      return a.category.localeCompare(b.category, 'ru', { sensitivity: 'base' })
    })

  return { groupedComments, commentsWithoutKeywords }
}

const shouldIncludeByRead = (comment: Comment, filter: ReadFilter) => {
  if (filter === 'read') return comment.isRead
  if (filter === 'unread') return !comment.isRead
  return true
}

const matchesSearch = (comment: Comment, searchLower: string) => {
  if (!searchLower) return true
  const matched = getMatchedKeywords(comment)
  const fields = [
    comment.author,
    comment.authorId,
    comment.text,
    comment.postText,
    comment.commentUrl,
    comment.watchlistAuthorId,
    comment.isWatchlisted ? 'watchlisted' : '',
    matched.map((item) => item.word).join(' '),
    matched.map((item) => item.category ?? '').join(' '),
  ]
  return fields.some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(searchLower)
  )
}

const useCommentsViewModel = () => {
  const comments = useCommentsStore((state) => state.comments)
  const isLoading = useCommentsStore((state) => state.isLoading)
  const fetchCommentsCursor = useCommentsStore((state) => state.fetchCommentsCursor)
  const isLoadingMore = useCommentsStore((state) => state.isLoadingMore)
  const hasMore = useCommentsStore((state) => state.hasMore)
  const totalCount = useCommentsStore((state) => state.totalCount)
  const readCount = useCommentsStore((state) => state.readCount)
  const unreadCount = useCommentsStore((state) => state.unreadCount)
  const toggleReadStatus = useCommentsStore((state) => state.toggleReadStatus)
  const markWatchlisted = useCommentsStore((state) => state.markWatchlisted)
  const { keywords, fetchKeywords } = useKeywordsStore()
  const { addAuthorFromComment } = useWatchlistStore()
  const [showKeywordComments, setShowKeywordComments] = useState(true)
  const [showKeywordPosts, setShowKeywordPosts] = useState(false)
  const [readFilter, setReadFilter] = useState<ReadFilter>('unread')
  const [searchTerm, setSearchTerm] = useState('')
  const [watchlistPending, setWatchlistPending] = useState<Record<number, boolean>>({})

  const hasKeywords = keywords.length > 0
  const shouldFilterByKeywordComments = showKeywordComments && hasKeywords
  const shouldFilterByKeywordPosts = showKeywordPosts && hasKeywords

  const { keywordFilterValues, keywordSource, trimmedSearch, searchLower } = useMemo(() => {
    const trimmed = searchTerm.trim()
    if (!shouldFilterByKeywordComments && !shouldFilterByKeywordPosts) {
      return {
        keywordFilterValues: undefined,
        keywordSource: undefined,
        trimmedSearch: trimmed,
        searchLower: trimmed.toLowerCase(),
      }
    }
    const normalized = keywords.map((item) => item.word.trim()).filter(Boolean)
    const values = normalized.length > 0 ? Array.from(new Set(normalized)) : undefined

    let source: 'COMMENT' | 'POST' | undefined = undefined
    if (shouldFilterByKeywordComments && shouldFilterByKeywordPosts) {
      source = undefined
    } else if (shouldFilterByKeywordComments) {
      source = 'COMMENT'
    } else if (shouldFilterByKeywordPosts) {
      source = 'POST'
    }

    return {
      keywordFilterValues: values,
      keywordSource: source,
      trimmedSearch: trimmed,
      searchLower: trimmed.toLowerCase(),
    }
  }, [keywords, searchTerm, shouldFilterByKeywordComments, shouldFilterByKeywordPosts])

  const fetchFilters = useMemo(
    () => ({
      keywords: keywordFilterValues,
      keywordSource,
      readStatus: readFilter,
      search: trimmedSearch,
    }),
    [keywordFilterValues, keywordSource, readFilter, trimmedSearch]
  )

  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      return shouldIncludeByRead(comment, readFilter) && matchesSearch(comment, searchLower)
    })
  }, [comments, readFilter, searchLower])

  const commentIndexMap = useMemo(
    () =>
      filteredComments.reduce((map, comment, index) => {
        map.set(comment.id, index)
        return map
      }, new Map<number, number>()),
    [filteredComments]
  )

  const { groupedComments, commentsWithoutKeywords } = useMemo(
    () => groupComments(filteredComments, commentIndexMap),
    [commentIndexMap, filteredComments]
  )

  const keywordCommentsTotal = useMemo(
    () => comments.filter((comment) => getMatchedKeywords(comment).length > 0).length,
    [comments]
  )

  const visibleCount = useMemo(() => filteredComments.length, [filteredComments])

  const emptyMessage = useMemo(() => {
    if (isLoading) return 'Загрузка...'
    const hasAnyKeywordFilter = showKeywordComments || showKeywordPosts
    if (readFilter === 'read') {
      return hasAnyKeywordFilter
        ? 'Нет прочитанных комментариев с ключевыми словами'
        : 'Нет прочитанных комментариев'
    }
    if (readFilter === 'unread') {
      return hasAnyKeywordFilter
        ? 'Все комментарии с ключевыми словами прочитаны'
        : 'Все комментарии прочитаны'
    }
    if (hasAnyKeywordFilter) return 'Нет комментариев с ключевыми словами'
    return trimmedSearch ? 'Ничего не найдено по вашему запросу' : 'Нет комментариев'
  }, [isLoading, readFilter, showKeywordComments, showKeywordPosts, trimmedSearch])

  useEffect(() => {
    if (comments.length > 0 && !hasKeywords) return
    fetchCommentsCursor({ reset: true, filters: fetchFilters }).catch((error) => {
      console.error('Failed to fetch comments with filters', error)
    })
  }, [comments.length, fetchCommentsCursor, fetchFilters, hasKeywords])

  useEffect(() => {
    if (keywords.length > 0) return
    fetchKeywords().catch((error) => {
      console.error('Failed to fetch keywords', error)
    })
  }, [fetchKeywords, keywords.length])

  const handleLoadMore = useCallback(() => {
    fetchCommentsCursor({ reset: false }).catch((error) => {
      console.error('Failed to load more comments', error)
    })
  }, [fetchCommentsCursor])

  const handleAddToWatchlist = useCallback(
    async (commentId: number) => {
      setWatchlistPending((prev) => ({ ...prev, [commentId]: true }))
      try {
        const author = await addAuthorFromComment({ commentId })
        markWatchlisted(commentId, author.id)
      } catch (error) {
        console.error('Не удалось добавить автора в список "На карандаше"', error)
      } finally {
        setWatchlistPending((prev) => {
          const next = { ...prev }
          delete next[commentId]
          return next
        })
      }
    },
    [addAuthorFromComment, markWatchlisted]
  )

  const handleSearchChange = useCallback((value: string) => setSearchTerm(value), [])
  const handleToggleKeywordComments = useCallback(
    (value: boolean) => setShowKeywordComments(value),
    []
  )
  const handleToggleKeywordPosts = useCallback((value: boolean) => setShowKeywordPosts(value), [])
  const handleReadFilterChange = useCallback((value: ReadFilter) => setReadFilter(value), [])

  return {
    totalCount,
    readCount,
    unreadCount,
    searchTerm,
    handleSearchChange,
    showKeywordComments,
    handleToggleKeywordComments,
    showKeywordPosts,
    handleToggleKeywordPosts,
    readFilter,
    handleReadFilterChange,
    keywordsCount: keywords.length,
    groupedComments,
    commentsWithoutKeywords,
    commentIndexMap,
    isLoading,
    emptyMessage,
    toggleReadStatus,
    handleLoadMore,
    hasMore,
    isLoadingMore,
    loadedCount: comments.length,
    visibleCount,
    hasDefinedKeywords: hasKeywords,
    handleAddToWatchlist,
    watchlistPending,
    keywordCommentsTotal,
  }
}

export default useCommentsViewModel

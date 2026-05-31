import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useCommentsStore } from '@/pages/comments/store'
import { useKeywordsStore } from '@/pages/keywords/store/keywordsStore'
import { useWatchlistStore } from '@/pages/watchlist/store/watchlistStore'
import { useCommentsSearchQuery } from '@/pages/comments/hooks/useCommentsSearchQuery'
import { buildCommentsSearchPayload } from '@/pages/comments/api/query/buildCommentsSearchQuery'
import type { Comment, Keyword } from '@/shared/types'
import { getCommentCategories } from '@/pages/comments/utils/getCommentCategories'
import { useDebounce } from '@/shared/hooks'

type TabMode = 'review' | 'watchlist' | 'all'
type FilterMode = 'all' | 'comments' | 'posts'
type CommentWithKeywords = { comment: Comment; matchedKeywords: Keyword[] }

export type { TabMode, FilterMode }

const DEFAULT_CATEGORY = 'Без категории'

const getMatchedKeywords = (comment: Comment): Keyword[] => {
  const value = (comment as Partial<Comment> & { matchedKeywords?: Keyword[] }).matchedKeywords
  return Array.isArray(value) ? value : []
}

const hasKeywordSource = (keywords: Keyword[], source: 'COMMENT' | 'POST') =>
  keywords.some((kw) => kw.source === source)

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

  return {
    groupedComments: groupedComments.map((group) => ({
      ...group,
      comments: group.comments.map((item) => ({
        ...item,
        categories: getCommentCategories(item.matchedKeywords),
      })),
    })),
    commentsWithoutKeywords: commentsWithoutKeywords.map((item) => ({
      ...item,
      categories: getCommentCategories(item.matchedKeywords),
    })),
  }
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

const shouldIncludeByKeywordSource = (matched: Keyword[], filter: FilterMode) => {
  if (filter === 'all') return true
  if (filter === 'comments') return hasKeywordSource(matched, 'COMMENT')
  if (filter === 'posts') return hasKeywordSource(matched, 'POST')
  return true
}

const buildEmptyMessage = ({
  isLoading,
  tabMode,
  filterMode,
  trimmedSearch,
}: {
  isLoading: boolean
  tabMode: TabMode
  filterMode: FilterMode
  trimmedSearch: string
}) => {
  if (isLoading) return 'Загрузка...'

  const prefix = tabMode === 'review' ? 'Непрочитанных' : tabMode === 'watchlist' ? 'Отслеживаемых' : ''
  const suffix = filterMode !== 'all'
    ? ` с совпадениями в ${filterMode === 'comments' ? 'комментариях' : 'постах'}`
    : ''

  if (trimmedSearch) return 'Ничего не найдено по вашему запросу'
  return `${prefix} комментариев нет${suffix}`.replace(/^(\s*,\s*)/, '')
}

const useCommentsViewModel = () => {
  const comments = useCommentsStore((state) => state.comments)
  const isLoading = useCommentsStore((state) => state.isLoading)
  const fetchCommentsCursor = useCommentsStore((state) => state.fetchCommentsCursor)
  const setCommentsFilters = useCommentsStore((state) => state.setFilters)
  const setCommentsQueryEnabled = useCommentsStore((state) => state.setQueryEnabled)
  const isLoadingMore = useCommentsStore((state) => state.isLoadingMore)
  const hasMore = useCommentsStore((state) => state.hasMore)
  const totalCount = useCommentsStore((state) => state.totalCount)
  const readCount = useCommentsStore((state) => state.readCount)
  const unreadCount = useCommentsStore((state) => state.unreadCount)
  const toggleReadStatus = useCommentsStore((state) => state.toggleReadStatus)
  const markWatchlisted = useCommentsStore((state) => state.markWatchlisted)
  const { keywords } = useKeywordsStore()
  const { addAuthorFromComment } = useWatchlistStore()
  const [tabMode, setTabMode] = useState<TabMode>('review')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [watchlistPending, setWatchlistPending] = useState<Record<number, boolean>>({})

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const trimmedSearch = debouncedSearchTerm.trim()
  const searchLower = trimmedSearch.toLowerCase()

  const readFilterForStore: 'unread' | 'all' = tabMode === 'review' ? 'unread' : 'all'

  const fetchFilters = useMemo(
    () => ({
      readStatus: readFilterForStore,
      search: trimmedSearch,
    }),
    [readFilterForStore, trimmedSearch]
  )

  const searchPayload = useMemo(
    () =>
      buildCommentsSearchPayload({
        query: trimmedSearch,
        viewMode: 'comments',
        page: 1,
        pageSize: 20,
        keywords: undefined,
        keywordSource: undefined,
        readStatus: readFilterForStore,
      }),
    [readFilterForStore, trimmedSearch]
  )

  const useSearchResults = trimmedSearch.length > 0

  const searchQuery = useCommentsSearchQuery(searchPayload, {
    enabled: useSearchResults,
  })

  const filteredByTab = useMemo(() => {
    return comments.filter((comment) => {
      if (tabMode === 'review') return !comment.isRead
      if (tabMode === 'watchlist') return comment.isWatchlisted
      return true
    })
  }, [comments, tabMode])

  const filteredComments = useMemo(() => {
    return filteredByTab.filter((comment) => {
      if (!matchesSearch(comment, searchLower)) return false
      const matched = getMatchedKeywords(comment)
      if (!shouldIncludeByKeywordSource(matched, filterMode)) return false
      return true
    })
  }, [filteredByTab, searchLower, filterMode])

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

  const visibleCount = useMemo(() => filteredComments.length, [filteredComments])

  const emptyMessage = useMemo(
    () =>
      buildEmptyMessage({
        isLoading,
        tabMode,
        filterMode,
        trimmedSearch,
      }),
    [isLoading, tabMode, filterMode, trimmedSearch]
  )

  useEffect(() => {
    if (useSearchResults) {
      setCommentsQueryEnabled(false)
      return
    }

    setCommentsFilters(fetchFilters, { enableQuery: true })

    return () => {
      setCommentsQueryEnabled(false)
    }
  }, [fetchFilters, setCommentsFilters, setCommentsQueryEnabled, useSearchResults])

  const handleLoadMore = useCallback(() => {
    if (useSearchResults) return

    fetchCommentsCursor({ reset: false }).catch((error) => {
      console.error('Failed to load more comments', error)
      toast.error('Не удалось загрузить комментарии')
    })
  }, [fetchCommentsCursor, useSearchResults])

  const handleToggleReadStatus = useCallback(
    async (id: number) => {
      try {
        await toggleReadStatus(id)
      } catch (error) {
        console.error('Failed to update comment read status', error)
        toast.error('Не удалось обновить статус комментария')
      }
    },
    [toggleReadStatus]
  )

  const handleAddToWatchlist = useCallback(
    async (commentId: number) => {
      setWatchlistPending((prev) => ({ ...prev, [commentId]: true }))
      try {
        const author = await addAuthorFromComment({ commentId })
        markWatchlisted(commentId, author.id)
      } catch (error) {
        console.error('Не удалось добавить автора в список "На карандаше"', error)
        toast.error('Не удалось добавить автора в список наблюдения')
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
  const handleTabChange = useCallback((mode: TabMode) => setTabMode(mode), [])
  const handleFilterChange = useCallback((mode: FilterMode) => setFilterMode(mode), [])

  return {
    totalCount: useSearchResults ? (searchQuery.data?.total ?? 0) : totalCount,
    readCount,
    unreadCount,
    searchTerm,
    handleSearchChange,
    tabMode,
    handleTabChange,
    filterMode,
    handleFilterChange,
    keywordsCount: keywords.length,
    groupedComments,
    commentsWithoutKeywords,
    commentIndexMap,
    isLoading: useSearchResults ? searchQuery.isLoading : isLoading,
    emptyMessage,
    toggleReadStatus: handleToggleReadStatus,
    handleLoadMore,
    hasMore: useSearchResults ? false : hasMore,
    isLoadingMore: useSearchResults ? false : isLoadingMore,
    loadedCount: useSearchResults ? (searchQuery.data?.items.length ?? 0) : comments.length,
    renderedCount: useSearchResults ? (searchQuery.data?.items.length ?? 0) : visibleCount,
    handleAddToWatchlist,
    watchlistPending,
    useSearchResults,
    searchResults: searchQuery.data,
    watchlistCount: comments.filter((c) => c.isWatchlisted).length,
  }
}

export default useCommentsViewModel

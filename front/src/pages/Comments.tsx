import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCommentsStore, useKeywordsStore, useWatchlistStore } from '../stores'
import CommentsFiltersPanel from './Comments/components/CommentsFiltersPanel'
import CommentsTableCard from './Comments/components/CommentsTableCard'
import CommentsHero from './Comments/components/CommentsHero'
import { Separator } from '@/components/ui/separator'
import type { Comment, Keyword } from '@/types'

const DEFAULT_CATEGORY = 'Без категории'

const ensureMatchedKeywords = (comment: Comment): Keyword[] => {
  const value = (comment as Partial<Comment> & { matchedKeywords?: Keyword[] }).matchedKeywords
  return Array.isArray(value) ? value : []
}

function Comments() {
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
  const keywords = useKeywordsStore((state) => state.keywords)
  const fetchKeywords = useKeywordsStore((state) => state.fetchKeywords)
  const addAuthorFromComment = useWatchlistStore((state) => state.addAuthorFromComment)
  const [showOnlyKeywordComments, setShowOnlyKeywordComments] = useState(true)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('unread')
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingWatchlist, setPendingWatchlist] = useState<Record<number, boolean>>({})

  const hasDefinedKeywords = keywords.length > 0

  const keywordFilterValues = useMemo(() => {
    if (!showOnlyKeywordComments || !hasDefinedKeywords) {
      return undefined
    }

    const normalized = keywords
      .map((item) => item.word.trim())
      .filter((word) => word.length > 0)

    if (normalized.length === 0) {
      return undefined
    }

    return Array.from(new Set(normalized))
  }, [hasDefinedKeywords, keywords, showOnlyKeywordComments])

  const normalizedSearch = useMemo(() => searchTerm.trim(), [searchTerm])

  const keywordCommentsTotal = useMemo(
    () =>
      comments.reduce(
        (total, comment) => (ensureMatchedKeywords(comment).length > 0 ? total + 1 : total),
        0,
      ),
    [comments],
  )

  useEffect(() => {
    fetchCommentsCursor({
      reset: true,
      filters: {
        keywords: keywordFilterValues,
        readStatus: readFilter,
        search: normalizedSearch,
      },
    }).catch((error) => {
      console.error('Failed to fetch comments with filters', error)
    })
  }, [fetchCommentsCursor, keywordFilterValues, normalizedSearch, readFilter])

  const filteredComments = useMemo(() => {
    let result = comments

    if (showOnlyKeywordComments && hasDefinedKeywords) {
      result = result.filter((comment) => ensureMatchedKeywords(comment).length > 0)
    }

    if (readFilter === 'read') {
      result = result.filter((comment) => comment.isRead)
    } else if (readFilter === 'unread') {
      result = result.filter((comment) => !comment.isRead)
    }

    const trimmedSearch = normalizedSearch.toLowerCase()

    if (trimmedSearch) {
      result = result.filter((comment) => {
        const matchedKeywords = ensureMatchedKeywords(comment)
        const fields = [
          comment.author,
          comment.authorId,
          comment.text,
          comment.commentUrl,
          comment.watchlistAuthorId,
          comment.isWatchlisted ? 'watchlisted' : '',
          matchedKeywords.map((keyword) => keyword.word).join(' '),
          matchedKeywords.map((keyword) => keyword.category ?? '').join(' '),
        ]

        return fields.some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(trimmedSearch),
        )
      })
    }

    return result
  }, [comments, hasDefinedKeywords, normalizedSearch, readFilter, showOnlyKeywordComments])

  const commentIndexMap = useMemo(() => {
    const map = new Map<number, number>()

    filteredComments.forEach((comment, index) => {
      map.set(comment.id, index)
    })

    return map
  }, [filteredComments])

  const { groupedComments, commentsWithoutKeywords } = useMemo(() => {
    const groupsMap = new Map<
      string,
      { category: string; comments: Array<{ comment: Comment; matchedKeywords: Keyword[] }> }
    >()
    const withoutKeywords: Array<{ comment: Comment; matchedKeywords: Keyword[] }> = []

    filteredComments.forEach((comment) => {
      const matchedKeywords = ensureMatchedKeywords(comment)

      if (matchedKeywords.length === 0) {
        withoutKeywords.push({ comment, matchedKeywords })
        return
      }

      const keywordsByCategory = new Map<string, Keyword[]>()

      matchedKeywords.forEach((keyword) => {
        const categoryName = keyword.category?.trim() || DEFAULT_CATEGORY
        const items = keywordsByCategory.get(categoryName) ?? []

        if (!items.some((item) => item.id === keyword.id)) {
          items.push(keyword)
        }

        keywordsByCategory.set(categoryName, items)
      })

      if (keywordsByCategory.size === 0) {
        withoutKeywords.push({ comment, matchedKeywords })
        return
      }

      keywordsByCategory.forEach((categoryKeywords, categoryName) => {
        const existing = groupsMap.get(categoryName) ?? { category: categoryName, comments: [] }
        existing.comments.push({ comment, matchedKeywords: categoryKeywords })
        groupsMap.set(categoryName, existing)
      })
    })

    const grouped = Array.from(groupsMap.values())

    grouped.forEach((group) => {
      group.comments.sort((a, b) => {
        const aIndex = commentIndexMap.get(a.comment.id) ?? 0
        const bIndex = commentIndexMap.get(b.comment.id) ?? 0
        return aIndex - bIndex
      })
    })

    grouped.sort((a, b) => {
      if (a.category === DEFAULT_CATEGORY && b.category !== DEFAULT_CATEGORY) {
        return -1
      }

      if (b.category === DEFAULT_CATEGORY && a.category !== DEFAULT_CATEGORY) {
        return 1
      }

      return a.category.localeCompare(b.category, 'ru', { sensitivity: 'base' })
    })

    return {
      groupedComments: grouped,
      commentsWithoutKeywords: withoutKeywords,
    }
  }, [commentIndexMap, filteredComments])

  const emptyMessage = useMemo(() => {
    if (isLoading) {
      return 'Загрузка...'
    }

    if (readFilter === 'read') {
      return showOnlyKeywordComments
        ? 'Нет прочитанных комментариев с ключевыми словами'
        : 'Нет прочитанных комментариев'
    }

    if (readFilter === 'unread') {
      return showOnlyKeywordComments
        ? 'Все комментарии с ключевыми словами прочитаны'
        : 'Все комментарии прочитаны'
    }

    if (showOnlyKeywordComments) {
      return 'Нет комментариев с ключевыми словами'
    }

    if (searchTerm.trim()) {
      return 'Ничего не найдено по вашему запросу'
    }

    return 'Нет комментариев'
  }, [isLoading, readFilter, showOnlyKeywordComments, searchTerm])

  useEffect(() => {
    if (keywords.length === 0) {
      const load = async () => {
        try {
          await fetchKeywords()
        } catch (error) {
          console.error('Failed to fetch keywords', error)
        }
      }

      void load()
    }
  }, [fetchKeywords, keywords.length])

  const loadedCount = comments.length

  const handleLoadMore = useCallback(() => {
    fetchCommentsCursor({ reset: false }).catch((error) => {
      console.error('Failed to load more comments', error)
    })
  }, [fetchCommentsCursor])

  const handleAddToWatchlist = useCallback(
    async (commentId: number) => {
      setPendingWatchlist((prev) => ({ ...prev, [commentId]: true }))

      try {
        const author = await addAuthorFromComment({ commentId })
        markWatchlisted(commentId, author.id)
      } catch (error) {
        console.error('Не удалось добавить автора в список "На карандаше"', error)
      } finally {
        setPendingWatchlist((prev) => {
          const next = { ...prev }
          delete next[commentId]
          return next
        })
      }
    },
    [addAuthorFromComment, markWatchlisted],
  )

  return (
    <div className="flex flex-col gap-8">

      <CommentsHero totalCount={totalCount} readCount={readCount} unreadCount={unreadCount} />

      <Separator className="opacity-40" />

      <CommentsFiltersPanel
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showOnlyKeywordComments={showOnlyKeywordComments}
        onToggleKeywords={setShowOnlyKeywordComments}
        readFilter={readFilter}
        onReadFilterChange={setReadFilter}
        keywordsCount={keywords.length}
      />

      <CommentsTableCard
        groupedComments={groupedComments}
        commentsWithoutKeywords={commentsWithoutKeywords}
        commentIndexMap={commentIndexMap}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        toggleReadStatus={toggleReadStatus}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        totalCount={totalCount}
        loadedCount={loadedCount}
        visibleCount={filteredComments.length}
        showOnlyKeywordComments={showOnlyKeywordComments}
        hasDefinedKeywords={hasDefinedKeywords}
        onAddToWatchlist={handleAddToWatchlist}
        watchlistPending={pendingWatchlist}
        keywordCommentsTotal={keywordCommentsTotal}
      />
    </div>
  )
}

export default Comments

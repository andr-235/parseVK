import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCommentsStore, useKeywordsStore, useWatchlistStore } from '../stores'
import CommentsFiltersPanel from './Comments/components/CommentsFiltersPanel'
import CommentsTableCard from './Comments/components/CommentsTableCard'
import CommentsHero from './Comments/components/CommentsHero'
import { Separator } from '@/components/ui/separator'
import type { Comment, Keyword } from '@/types'

const DEFAULT_CATEGORY = 'Без категории'

function Comments() {
  const comments = useCommentsStore((state) => state.comments)
  const isLoading = useCommentsStore((state) => state.isLoading)
  const fetchCommentsCursor = useCommentsStore((state) => state.fetchCommentsCursor)
  const isLoadingMore = useCommentsStore((state) => state.isLoadingMore)
  const hasMore = useCommentsStore((state) => state.hasMore)
  const totalCount = useCommentsStore((state) => state.totalCount)
  const toggleReadStatus = useCommentsStore((state) => state.toggleReadStatus)
  const markWatchlisted = useCommentsStore((state) => state.markWatchlisted)
  const keywords = useKeywordsStore((state) => state.keywords)
  const fetchKeywords = useKeywordsStore((state) => state.fetchKeywords)
  const addAuthorFromComment = useWatchlistStore((state) => state.addAuthorFromComment)
  const [showOnlyKeywordComments, setShowOnlyKeywordComments] = useState(true)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('unread')
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingWatchlist, setPendingWatchlist] = useState<Record<number, boolean>>({})

  const keywordsWithMeta = useMemo(
    () =>
      keywords
        .map((keyword) => {
          const normalizedWord = keyword.word.trim().toLowerCase()

          if (!normalizedWord) {
            return null
          }

          return {
            keyword,
            normalizedWord,
            categoryName: keyword.category?.trim() || DEFAULT_CATEGORY,
          }
        })
        .filter(
          (value): value is { keyword: Keyword; normalizedWord: string; categoryName: string } => Boolean(value),
        ),
    [keywords],
  )

  const keywordMatchData = useMemo(() => {
    const matchesByComment = new Map<number, Map<string, Keyword[]>>()
    const matchedIds = new Set<number>()

    if (keywordsWithMeta.length === 0) {
      return { matchesByComment, matchedIds }
    }

    comments.forEach((comment) => {
      const text = comment.text.toLowerCase()

      if (!text) {
        return
      }

      const matchedEntries = keywordsWithMeta.filter((item) => text.includes(item.normalizedWord))

      if (matchedEntries.length === 0) {
        return
      }

      matchedIds.add(comment.id)

      const categoriesMap = new Map<string, Keyword[]>()

      matchedEntries.forEach(({ keyword, categoryName }) => {
        const items = categoriesMap.get(categoryName) ?? []

        if (!items.some((item) => item.id === keyword.id)) {
          items.push(keyword)
        }

        categoriesMap.set(categoryName, items)
      })

      matchesByComment.set(comment.id, categoriesMap)
    })

    return { matchesByComment, matchedIds }
  }, [comments, keywordsWithMeta])

  const { matchesByComment, matchedIds } = keywordMatchData
  const keywordCommentsTotal = matchedIds.size

  const hasDefinedKeywords = keywordsWithMeta.length > 0

  const filteredComments = useMemo(() => {
    let result = comments

    if (showOnlyKeywordComments && hasDefinedKeywords) {
      result = result.filter((comment) => matchedIds.has(comment.id))
    }

    if (readFilter === 'read') {
      result = result.filter((comment) => comment.isRead)
    } else if (readFilter === 'unread') {
      result = result.filter((comment) => !comment.isRead)
    }

    const trimmedSearch = searchTerm.trim().toLowerCase()

    if (trimmedSearch) {
      result = result.filter((comment) =>
        Object.values(comment).some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(trimmedSearch),
        ),
      )
    }

    return result
  }, [comments, hasDefinedKeywords, matchedIds, readFilter, searchTerm, showOnlyKeywordComments])

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
    const withoutKeywords: Comment[] = []

    filteredComments.forEach((comment) => {
      const categoriesMap = matchesByComment.get(comment.id)

      if (!categoriesMap || categoriesMap.size === 0) {
        withoutKeywords.push(comment)
        return
      }

      categoriesMap.forEach((categoryKeywords, categoryName) => {
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
  }, [commentIndexMap, filteredComments, matchesByComment])

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

      <CommentsHero filteredCount={totalCount} />

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

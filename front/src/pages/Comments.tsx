import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCommentsStore, useKeywordsStore } from '../stores'
import CommentsFiltersPanel from './Comments/components/CommentsFiltersPanel'
import CommentsTableCard from './Comments/components/CommentsTableCard'
import CommentsHero from './Comments/components/CommentsHero'
import { Separator } from '@/components/ui/separator'

function Comments() {
  const comments = useCommentsStore((state) => state.comments)
  const isLoading = useCommentsStore((state) => state.isLoading)
  const fetchComments = useCommentsStore((state) => state.fetchComments)
  const isLoadingMore = useCommentsStore((state) => state.isLoadingMore)
  const hasMore = useCommentsStore((state) => state.hasMore)
  const totalCount = useCommentsStore((state) => state.totalCount)
  const toggleReadStatus = useCommentsStore((state) => state.toggleReadStatus)
  const keywords = useKeywordsStore((state) => state.keywords)
  const fetchKeywords = useKeywordsStore((state) => state.fetchKeywords)
  const [showOnlyKeywordComments, setShowOnlyKeywordComments] = useState(false)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const normalizedKeywords = useMemo(
    () =>
      keywords
        .map((keyword) => keyword.word.trim().toLowerCase())
        .filter(Boolean),
    [keywords],
  )

  const filteredComments = useMemo(() => {
    let result = comments

    if (showOnlyKeywordComments && normalizedKeywords.length > 0) {
      result = result.filter((comment) => {
        const text = comment.text.toLowerCase()
        return normalizedKeywords.some((keyword) => text.includes(keyword))
      })
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
  }, [comments, normalizedKeywords, readFilter, searchTerm, showOnlyKeywordComments])

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

  const isFetchingRef = useRef(false)

  const loadComments = useCallback(
    async (reset: boolean) => {
      if (isFetchingRef.current) {
        return
      }

      isFetchingRef.current = true

      try {
        await fetchComments({ reset })
      } catch (error) {
        console.error('Failed to fetch comments', error)
      } finally {
        isFetchingRef.current = false
      }
    },
    [fetchComments],
  )

  useEffect(() => {
    let isUnmounted = false

    const runInitialLoad = async () => {
      if (isUnmounted) {
        return
      }

      await loadComments(true)
    }

    void runInitialLoad()

    const intervalId = window.setInterval(() => {
      if (!isUnmounted) {
        void loadComments(true)
      }
    }, 30000)

    return () => {
      isUnmounted = true
      window.clearInterval(intervalId)
    }
  }, [loadComments])

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
    void loadComments(false)
  }, [loadComments])

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
        comments={filteredComments}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        keywords={keywords}
        toggleReadStatus={toggleReadStatus}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        totalCount={totalCount}
        loadedCount={loadedCount}
      />
    </div>
  )
}

export default Comments

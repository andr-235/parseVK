import { useCallback, useMemo, useState } from 'react'
import type { Comment } from '@/types'
import {
  normalizeThreadItems,
  countThreadItems,
  getMaxThreadDepth,
} from '@/modules/comments/utils/threadUtils'

interface UseCommentThreadOptions {
  maxDepth?: number
  defaultExpanded?: boolean
}

export function useCommentThread(comment: Comment, options: UseCommentThreadOptions = {}) {
  const { maxDepth = 3, defaultExpanded = false } = options

  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set())

  // Memoized thread items processing (rerender optimization)
  const threadItems = useMemo(
    () => normalizeThreadItems(comment.threadItems),
    [comment.threadItems]
  )

  // Memoized computed values (rerender optimization)
  const hasThreads = useMemo(() => threadItems !== null && threadItems.length > 0, [threadItems])

  const threadCount = useMemo(
    () => comment.threadCount ?? (hasThreads ? countThreadItems(threadItems) : 0),
    [comment.threadCount, hasThreads, threadItems]
  )

  const maxDepthInThread = useMemo(
    () => (hasThreads ? getMaxThreadDepth(threadItems) : 0),
    [hasThreads, threadItems]
  )

  // Memoized handlers (rerender optimization)
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const toggleThreadExpanded = useCallback((threadId: number) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev)
      if (next.has(threadId)) {
        next.delete(threadId)
      } else {
        next.add(threadId)
      }
      return next
    })
  }, [])

  const isThreadExpanded = useCallback(
    (threadId: number) => {
      return expandedThreads.has(threadId)
    },
    [expandedThreads]
  )

  return {
    threadItems,
    hasThreads,
    threadCount,
    maxDepthInThread,
    isExpanded,
    toggleExpanded,
    toggleThreadExpanded,
    isThreadExpanded,
    maxDepth,
  }
}

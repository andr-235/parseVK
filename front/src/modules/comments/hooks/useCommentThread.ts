import { useState, useMemo } from 'react'
import type { Comment, ThreadItem } from '@/types'
import { normalizeThreadItems, countThreadItems, getMaxThreadDepth } from '@/modules/comments/utils/threadUtils'

interface UseCommentThreadOptions {
  maxDepth?: number
  defaultExpanded?: boolean
}

export function useCommentThread(
  comment: Comment,
  options: UseCommentThreadOptions = {}
) {
  const { maxDepth = 3, defaultExpanded = false } = options

  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set())

  const threadItems = useMemo(
    () => normalizeThreadItems(comment.threadItems),
    [comment.threadItems]
  )

  const hasThreads = threadItems !== null && threadItems.length > 0
  const threadCount = comment.threadCount ?? (hasThreads ? countThreadItems(threadItems) : 0)
  const maxDepthInThread = hasThreads ? getMaxThreadDepth(threadItems) : 0

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  const toggleThreadExpanded = (threadId: number) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev)
      if (next.has(threadId)) {
        next.delete(threadId)
      } else {
        next.add(threadId)
      }
      return next
    })
  }

  const isThreadExpanded = (threadId: number) => {
    return expandedThreads.has(threadId)
  }

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


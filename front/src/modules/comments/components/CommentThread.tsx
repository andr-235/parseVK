import { memo, useCallback, useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import type { Comment, Keyword } from '@/types'
import { normalizeThreadItems, countThreadItems } from '@/modules/comments/utils/threadUtils'
import { CommentThreadItem } from './CommentThreadItem'

interface CommentThreadProps {
  comment: Comment
  keywords?: Keyword[]
  maxDepth?: number
  defaultExpanded?: boolean
  onReplyClick?: (commentId: number) => void
}

export const CommentThread = memo(function CommentThread({
  comment,
  keywords = [],
  maxDepth = 3,
  defaultExpanded = true,
  onReplyClick,
}: CommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Memoized handler (rerender optimization)
  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const threadItems = normalizeThreadItems(comment.threadItems)
  const hasThreads = threadItems && threadItems.length > 0
  const threadCount = comment.threadCount ?? (hasThreads ? countThreadItems(threadItems) : 0)

  if (!hasThreads || threadCount === 0) {
    return null
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 font-mono-accent text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          onClick={handleToggleExpand}
        >
          {isExpanded ? (
            <ChevronUp className="mr-1.5 size-3.5" />
          ) : (
            <ChevronDown className="mr-1.5 size-3.5" />
          )}
          <MessageSquare className="mr-1.5 size-3.5" />
          Ответы в треде
          <Badge
            variant="secondary"
            className="ml-2 h-5 border-0 bg-cyan-500/10 px-1.5 font-mono-accent text-[10px] font-normal text-cyan-400"
          >
            {threadCount}
          </Badge>
        </Button>
      </div>

      {isExpanded && threadItems && (
        <div className="mt-2 space-y-2">
          {threadItems.map((item, index) => (
            <CommentThreadItem
              key={`${item.vkCommentId}-${index}`}
              item={item}
              depth={0}
              maxDepth={maxDepth}
              keywords={keywords}
              onReplyClick={onReplyClick}
            />
          ))}
        </div>
      )}
    </div>
  )
})

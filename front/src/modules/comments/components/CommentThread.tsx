import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

export function CommentThread({
  comment,
  keywords = [],
  maxDepth = 3,
  defaultExpanded = true,
  onReplyClick,
}: CommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const threadItems = normalizeThreadItems(comment.threadItems)
  const hasThreads = threadItems && threadItems.length > 0
  const threadCount = comment.threadCount ?? (hasThreads ? countThreadItems(threadItems) : 0)

  if (!hasThreads || threadCount === 0) {
    return null
  }

  return (
    <div className="mt-3 border-t border-border/30 pt-3">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
          )}
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          Ответы в треде
          <Badge
            variant="secondary"
            className="ml-2 h-5 px-1.5 text-[10px] font-normal"
          >
            {threadCount}
          </Badge>
        </Button>
      </div>

      {isExpanded && threadItems && (
        <div className="space-y-2 mt-2">
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
}


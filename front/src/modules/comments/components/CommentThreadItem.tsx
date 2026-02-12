import { memo, useCallback, useState } from 'react'
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils'
import type { ThreadItem } from '@/types'
import { formatDateTime } from '@/modules/comments/utils/formatDateTime'
import { highlightKeywords } from '@/shared/utils/highlightKeywords'
import { CommentAttachments } from './CommentAttachments'
import type { Keyword } from '@/types'

interface CommentThreadItemProps {
  item: ThreadItem
  depth: number
  maxDepth: number
  keywords?: Keyword[]
  onReplyClick?: (commentId: number) => void
}

export const CommentThreadItem = memo(function CommentThreadItem({
  item,
  depth,
  maxDepth,
  keywords = [],
  onReplyClick,
}: CommentThreadItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2)
  const hasNestedThreads = item.threadItems && item.threadItems.length > 0
  const canExpand = depth < maxDepth && hasNestedThreads

  // Memoized handlers (rerender optimization)
  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleExpandNested = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const authorName = item.author
    ? `${item.author.firstName} ${item.author.lastName}`.trim()
    : `ID${item.fromId}`

  const attachments = Array.isArray(item.attachments) ? item.attachments : []

  return (
    <div className={cn('relative', depth > 0 && 'ml-6')}>
      {/* Connection line for nested items */}
      {depth > 0 && (
        <div className={cn('absolute bottom-0 left-0 top-0 w-px bg-white/10', '-translate-x-6')} />
      )}

      <div
        className={cn(
          'group relative rounded-lg border border-white/10 bg-slate-900/30 p-3 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-slate-900/40',
          depth > 0 && 'ml-2'
        )}
      >
        {/* Comment header */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {canExpand && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-slate-400 hover:bg-white/5 hover:text-white"
                onClick={handleToggleExpand}
              >
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </Button>
            )}

            <div className="flex min-w-0 flex-1 items-center gap-2">
              {item.author?.logo && (
                <img
                  src={item.author.logo}
                  alt={authorName}
                  className="size-6 rounded-full border border-white/10"
                  loading="lazy"
                />
              )}
              <span className="truncate font-monitoring-display text-sm font-semibold text-white">
                {authorName}
              </span>
              {item.replyToUser && item.replyToUser !== item.fromId && (
                <span className="font-mono-accent text-xs text-slate-500">
                  → ответ на ID{item.replyToUser}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {item.likesCount != null && item.likesCount > 0 && (
              <span className="font-mono-accent text-xs text-slate-500">❤️ {item.likesCount}</span>
            )}
            <time dateTime={item.publishedAt} className="font-mono-accent text-xs text-slate-400">
              {formatDateTime(item.publishedAt)}
            </time>
          </div>
        </div>

        {/* Comment text */}
        <div className="mb-2 whitespace-pre-wrap break-words font-monitoring-body text-sm leading-relaxed text-slate-200">
          {highlightKeywords(item.text, keywords)}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-2">
            <CommentAttachments attachments={attachments} />
          </div>
        )}

        {/* Nested threads indicator */}
        {hasNestedThreads && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 font-mono-accent text-xs text-slate-400 hover:bg-white/5 hover:text-white"
            onClick={handleExpandNested}
          >
            <MessageSquare className="mr-1.5 size-3.5" />
            {item.threadItems?.length} ответов
          </Button>
        )}
      </div>

      {/* Nested threads */}
      {isExpanded && hasNestedThreads && item.threadItems && (
        <div className="mt-2 space-y-2">
          {item.threadItems.map((nestedItem, index) => (
            <CommentThreadItem
              key={`${nestedItem.vkCommentId}-${index}`}
              item={nestedItem}
              depth={depth + 1}
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

import { memo, useCallback, useState } from 'react'
import { ChevronDown, ChevronRight, Heart, MessageSquare } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn, ensureArray, formatDateTime } from '@/shared/utils'
import type { ThreadItem } from '@/shared/types'
import { highlightKeywords } from '@/shared/utils/highlightKeywords'
import { CommentAttachments } from './CommentAttachments'
import type { Keyword } from '@/shared/types'

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

  const attachments = ensureArray(item.attachments)

  return (
    <div className={cn('relative', depth > 0 && 'ml-6')}>
      {/* Connection line for nested items */}
      {depth > 0 && (
        <div className={cn('absolute bottom-0 left-0 top-0 w-px bg-border/30', '-translate-x-6')} />
      )}

      <div
        className={cn(
          'group relative rounded-lg border border-border/20 bg-background-secondary/40 p-3 transition-all hover:border-border/40 hover:bg-background-secondary/60',
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
                aria-label={isExpanded ? 'Свернуть ответы' : 'Развернуть ответы'}
                className="size-8 shrink-0 text-text-secondary hover:bg-background-primary/40 hover:text-text-light"
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
                  className="size-6 rounded-full border border-border/20"
                  loading="lazy"
                />
              )}
              <span className="truncate font-monitoring-display text-sm font-semibold text-text-light">
                {authorName}
              </span>
              {item.replyToUser && item.replyToUser !== item.fromId && (
                <span className="font-mono-accent text-[10px] text-text-secondary/70">
                  → ответ на ID{item.replyToUser}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {item.likesCount != null && item.likesCount > 0 && (
              <span className="inline-flex items-center gap-1 font-mono-accent text-[10px] text-text-secondary/70" aria-label={`Нравится: ${item.likesCount}`}>
                <Heart className="size-3" aria-hidden="true" />
                {item.likesCount}
              </span>
            )}
            <time dateTime={item.publishedAt} className="font-mono-accent text-[10px] text-text-secondary">
              {formatDateTime(item.publishedAt)}
            </time>
          </div>
        </div>

        {/* Comment text */}
        <div className="mb-2 whitespace-pre-wrap break-words font-monitoring-body text-sm leading-relaxed text-text-primary">
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
            className="h-7 font-mono-accent text-xs text-text-secondary hover:bg-background-primary/40 hover:text-text-light"
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

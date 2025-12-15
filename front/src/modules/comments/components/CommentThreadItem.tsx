import { useState } from 'react'
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ThreadItem } from '@/types'
import { formatDateTime } from '@/modules/comments/utils/formatDateTime'
import { highlightKeywords } from '@/modules/comments/utils/highlightKeywords'
import { CommentAttachments } from './CommentAttachments'
import type { Keyword } from '@/types'

interface CommentThreadItemProps {
  item: ThreadItem
  depth: number
  maxDepth: number
  keywords?: Keyword[]
  onReplyClick?: (commentId: number) => void
}

export function CommentThreadItem({
  item,
  depth,
  maxDepth,
  keywords = [],
  onReplyClick,
}: CommentThreadItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2)
  const hasNestedThreads = item.threadItems && item.threadItems.length > 0
  const canExpand = depth < maxDepth && hasNestedThreads

  const authorName = item.author
    ? `${item.author.firstName} ${item.author.lastName}`.trim()
    : `ID${item.fromId}`

  const attachments = Array.isArray(item.attachments) ? item.attachments : []

  return (
    <div className={cn('relative', depth > 0 && 'ml-6')}>
      {/* Линия связи для вложенных элементов */}
      {depth > 0 && (
        <div className={cn('absolute left-0 top-0 bottom-0 w-px bg-border/40', '-translate-x-6')} />
      )}

      <div
        className={cn(
          'group relative rounded-lg border border-border/30 bg-card/50 p-3 transition-all hover:border-border/60 hover:bg-card',
          depth > 0 && 'ml-2'
        )}
      >
        {/* Заголовок комментария */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {canExpand && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.author?.logo && (
                <img
                  src={item.author.logo}
                  alt={authorName}
                  className="h-6 w-6 rounded-full border border-border/40"
                />
              )}
              <span className="text-sm font-semibold text-foreground truncate">{authorName}</span>
              {item.replyToUser && item.replyToUser !== item.fromId && (
                <span className="text-xs text-muted-foreground">
                  → ответ на ID{item.replyToUser}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.likesCount != null && item.likesCount > 0 && (
              <span className="text-xs text-muted-foreground">
                ❤️ {item.likesCount}
              </span>
            )}
            <time dateTime={item.publishedAt} className="text-xs text-muted-foreground">
              {formatDateTime(item.publishedAt)}
            </time>
          </div>
        </div>

        {/* Текст комментария */}
        <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words mb-2">
          {highlightKeywords(item.text, keywords)}
        </div>

        {/* Вложения */}
        {attachments.length > 0 && (
          <div className="mb-2">
            <CommentAttachments attachments={attachments} />
          </div>
        )}

        {/* Индикатор вложенных тредов */}
        {hasNestedThreads && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(true)}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            {item.threadItems?.length} ответов
          </Button>
        )}
      </div>

      {/* Вложенные треды */}
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
}

import { memo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { formatDateTime } from '@/shared/utils'

interface CommentMetaRightProps {
  publishedAt?: string | null
  createdAt?: string | null
  isRead: boolean
}

export const CommentMetaRight = memo(function CommentMetaRight({
  publishedAt,
  createdAt,
  isRead,
}: CommentMetaRightProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <time
        dateTime={publishedAt ?? createdAt ?? ''}
        className="whitespace-nowrap font-mono-accent text-xs text-text-secondary/70"
      >
        {formatDateTime(publishedAt ?? createdAt)}
      </time>

      {isRead && (
        <CheckCircle2 className="size-3.5 text-accent-success/60" />
      )}
    </div>
  )
})

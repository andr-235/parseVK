import { Clock, ExternalLink } from 'lucide-react'
import { type WatchlistComment } from '../../../shared/api/watchlist'
import { formatDateTime } from '../../../shared/utils/time'

type CommentItemProps = {
  comment: WatchlistComment
}

export function CommentItem({ comment }: CommentItemProps) {
  const vkUrl = `https://vk.com/wall${comment.ownerId}_${comment.postId}?reply=${comment.vkCommentId}`
  return (
    <div className="p-3 rounded-md border border-border bg-bg-panel hover:border-text-muted transition-colors duration-150">
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
          <Clock size={10} /> {formatDateTime(comment.publishedAt || comment.createdAt)}
        </span>
        <a
          href={vkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-accent font-semibold flex items-center gap-1 hover:underline shrink-0"
        >
          В источник <ExternalLink size={10} />
        </a>
      </div>
      <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
        {comment.text}
      </p>
      <div className="mt-2 pt-2 border-t border-border/50 flex justify-between items-center text-[9px] text-text-muted">
        <span>Источник: {comment.source}</span>
        <span>ID: {comment.id}</span>
      </div>
    </div>
  )
}

import { memo } from 'react'
import type { CategorizedComment } from '@/pages/comments/types/commentsTable'
import CommentCard from './CommentCard'

interface CommentGroupedListProps {
  items: CategorizedComment[]
  commentIndexMap: Map<number, number>
  toggleReadStatus: (id: number) => Promise<void>
  onAddToWatchlist?: (commentId: number) => void
  watchlistPending?: Record<number, boolean>
}

export const CommentGroupedList = memo(function CommentGroupedList({
  items,
  commentIndexMap,
  toggleReadStatus,
  onAddToWatchlist,
  watchlistPending,
}: CommentGroupedListProps) {
  return (
    <>
      {items.map(({ comment, matchedKeywords }) => (
        <CommentCard
          key={`comment-${comment.id}`}
          comment={comment}
          index={commentIndexMap.get(comment.id) ?? 0}
          matchedKeywords={matchedKeywords}
          toggleReadStatus={toggleReadStatus}
          onAddToWatchlist={onAddToWatchlist}
          isWatchlistLoading={Boolean(watchlistPending?.[comment.id])}
        />
      ))}
    </>
  )
})

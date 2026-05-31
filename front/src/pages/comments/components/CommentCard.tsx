import { memo, useState, lazy, Suspense, useMemo, useCallback } from 'react'
import { Spinner } from '@/shared/components/ui/spinner'
import { cn, ensureArray } from '@/shared/utils'
import type { Comment, Keyword } from '@/shared/types'
import { resolveCommentKeywords } from '@/pages/comments/utils/resolveCommentKeywords'
import { CommentAuthorRow } from './CommentAuthorRow'
import { CommentPostContext } from './CommentPostContext'
import { CommentMetaRight } from './CommentMetaRight'
import { CommentActions } from './CommentActions'
import { ClampExpandText } from './ClampExpandText'

const PostPreviewModal = lazy(() => import('./PostPreviewModal'))

interface CommentCardProps {
  comment: Comment
  index: number
  toggleReadStatus: (id: number) => Promise<void>
  onAddToWatchlist?: (commentId: number) => void
  isWatchlistLoading?: boolean
  matchedKeywords?: Keyword[]
}

const CommentCard = memo(function CommentCard({
  comment,
  toggleReadStatus,
  onAddToWatchlist,
  isWatchlistLoading,
  matchedKeywords,
}: CommentCardProps) {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)

  const handleToggleCommentExpand = useCallback(() => {
    setIsCommentExpanded((prev) => !prev)
  }, [])

  const handleOpenModal = useCallback(() => {
    setIsPostModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsPostModalOpen(false)
  }, [])

  const handleToggleRead = useCallback(() => {
    void toggleReadStatus(comment.id)
  }, [toggleReadStatus, comment.id])

  const handleAddToWatchlist = useCallback(() => {
    if (!comment.isWatchlisted && onAddToWatchlist) {
      onAddToWatchlist(comment.id)
    }
  }, [comment.isWatchlisted, comment.id, onAddToWatchlist])

  const resolved = useMemo(
    () => resolveCommentKeywords({
      matchedKeywords,
      commentText: comment.text,
      postText: comment.postText,
    }),
    [matchedKeywords, comment.text, comment.postText]
  )

  const postAttachments = useMemo(() => ensureArray(comment.postAttachments), [comment.postAttachments])
  const hasPostContent = comment.postText || comment.postGroup || postAttachments.length > 0

  return (
    <div
      data-comment-id={comment.id}
      className={cn(
        'group/row flex items-start gap-3 border-b border-border/40 px-4 py-2',
        'hover:bg-background-secondary/60',
        'animate-read',
        comment.isRead && 'opacity-60 hover:opacity-100'
      )}
    >
      <CommentAuthorRow
        author={comment.author}
        authorUrl={comment.authorUrl}
        authorAvatar={comment.authorAvatar}
      />

      {hasPostContent && (
        <CommentPostContext
          groupName={comment.postGroup?.name}
          groupPhoto={comment.postGroup?.photo}
          postText={comment.postText}
          onOpenPostModal={handleOpenModal}
        />
      )}

      <div className="min-w-0 flex-1">
        <ClampExpandText
          text={comment.text}
          keywords={resolved.fromComment.length > 0 ? resolved.fromComment : resolved.all}
          isExpanded={isCommentExpanded}
          onToggle={handleToggleCommentExpand}
          labelExpanded="Свернуть"
          labelCollapsed="Развернуть"
          lineClamp={2}
          className="leading-snug text-text-primary"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <CommentMetaRight
          publishedAt={comment.publishedAt}
          createdAt={comment.createdAt}
          isRead={comment.isRead}
        />

        <CommentActions
          commentUrl={comment.commentUrl}
          isRead={comment.isRead}
          isWatchlisted={comment.isWatchlisted}
          isWatchlistLoading={isWatchlistLoading}
          onAddToWatchlist={handleAddToWatchlist}
          onToggleRead={handleToggleRead}
        />
      </div>

      {isPostModalOpen && (
        <Suspense fallback={<Spinner />}>
          <PostPreviewModal
            isOpen={isPostModalOpen}
            postText={comment.postText ?? null}
            postAttachments={comment.postAttachments ?? null}
            postGroup={comment.postGroup ?? null}
            postUrl={
              comment.commentUrl
                ? comment.commentUrl
                    .replace(/\/wall-\d+_\d+\?reply=\d+/, '')
                    .replace(/#reply\d+/, '')
                : null
            }
            keywords={resolved.fromPost.length > 0 ? resolved.fromPost : resolved.all}
            onClose={handleCloseModal}
          />
        </Suspense>
      )}
    </div>
  )
})

export default CommentCard

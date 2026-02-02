import { memo, useState, useCallback, lazy, Suspense } from 'react'
import { BookmarkPlus, CheckCircle2, ExternalLink, Eye, Maximize2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { cn } from '@/shared/utils'
import type { Comment, Keyword } from '@/types'
import { formatDateTime } from '@/modules/comments/utils/formatDateTime'
import { getAuthorInitials } from '@/modules/comments/utils/getAuthorInitials'
import { highlightKeywords } from '@/modules/comments/utils/highlightKeywords'
import { resolveCommentKeywords } from '@/modules/comments/utils/resolveCommentKeywords'
import { resolveCommentVisibility } from '@/modules/comments/utils/resolveCommentVisibility'
import { CommentAttachments } from './CommentAttachments'
import { CommentThread } from './CommentThread'

// Lazy load модального окна (bundle optimization)
const PostPreviewModal = lazy(() => import('./PostPreviewModal'))

interface CommentCardProps {
  comment: Comment
  index: number
  toggleReadStatus: (id: number) => Promise<void>
  onAddToWatchlist?: (commentId: number) => void
  isWatchlistLoading?: boolean
  matchedKeywords?: Keyword[]
  showKeywordComments?: boolean
  showKeywordPosts?: boolean
  hidePostContext?: boolean
}

const CommentCard = memo(function CommentCard({
  comment,
  toggleReadStatus,
  onAddToWatchlist,
  isWatchlistLoading,
  matchedKeywords,
  showKeywordComments,
  showKeywordPosts,
  hidePostContext = false,
}: CommentCardProps) {
  const [isPostExpanded, setIsPostExpanded] = useState(false)
  const [isCommentExpanded, setIsCommentExpanded] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)

  // Memoized handlers (rerender optimization)
  const handleTogglePostExpand = useCallback(() => {
    setIsPostExpanded((prev) => !prev)
  }, [])

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

  const { fromPost, fromComment, all } = resolveCommentKeywords({
    matchedKeywords,
    commentText: comment.text,
    postText: comment.postText,
  })

  const { shouldShowPost, shouldShowComment } = resolveCommentVisibility({
    hidePostContext,
    showKeywordComments,
    showKeywordPosts,
  })

  const postAttachments = Array.isArray(comment.postAttachments) ? comment.postAttachments : []
  const hasPostContent = comment.postText || comment.postGroup || postAttachments.length > 0

  return (
    <div
      className={cn(
        'group relative flex gap-4 rounded-lg border border-white/5 bg-slate-900/30 p-5 backdrop-blur-sm transition-all duration-300',
        'hover:border-white/10 hover:bg-slate-900/50 hover:shadow-lg',
        comment.isRead && 'opacity-70 hover:opacity-100'
      )}
    >
      {/* Subtle glow on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-lg bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:from-cyan-500/10 group-hover:via-blue-500/10 group-hover:to-purple-500/10 group-hover:opacity-100" />

      {/* Avatar column */}
      <div className="relative shrink-0">
        <Avatar className="size-11 border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-105">
          {comment.authorAvatar ? (
            <AvatarImage
              src={comment.authorAvatar}
              alt={comment.author}
              loading="lazy"
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-cyan-500/10 font-monitoring-display text-sm font-semibold text-cyan-400">
            {getAuthorInitials(comment.author)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content column */}
      <div className="relative flex-1 min-w-0 space-y-3">
        {/* Header: Author and meta */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {/* Author name */}
            <div className="flex items-center gap-2 flex-wrap">
              {comment.authorUrl ? (
                <a
                  href={comment.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-monitoring-display text-base font-semibold text-white transition-colors duration-200 hover:text-cyan-400"
                >
                  {comment.author}
                </a>
              ) : (
                <span className="font-monitoring-display text-base font-semibold text-white">
                  {comment.author}
                </span>
              )}

              {comment.authorId && (
                <span className="rounded border border-white/10 bg-slate-800/50 px-2 py-0.5 font-mono-accent text-[10px] text-slate-400">
                  ID: {comment.authorId}
                </span>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 font-mono-accent text-xs text-slate-400">
              <time
                dateTime={comment.publishedAt ?? comment.createdAt}
                className="transition-colors hover:text-slate-300"
              >
                {formatDateTime(comment.publishedAt ?? comment.createdAt)}
              </time>
              {comment.isRead && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1 text-green-500/80">
                    <CheckCircle2 className="size-3" />
                    Прочитано
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {comment.commentUrl && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-slate-400 transition-colors hover:bg-white/5 hover:text-cyan-400"
                      asChild
                    >
                      <a href={comment.commentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl">
                    Открыть в VK
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Post context */}
        {shouldShowPost && hasPostContent && (
          <div className="relative space-y-3 rounded-lg border-l-2 border-cyan-500/30 bg-slate-800/30 py-3 pl-4 pr-3">
            {/* Context label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono-accent text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Контекст поста
                </span>
                {fromPost.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {fromPost.map((kw) => (
                      <Badge
                        key={kw.id}
                        className="h-5 border-0 bg-amber-500/10 px-1.5 font-mono-accent text-[9px] text-amber-400"
                      >
                        {kw.word}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-slate-400 transition-colors hover:text-white"
                onClick={handleOpenModal}
                title="Открыть полный текст поста"
              >
                <Maximize2 className="size-3.5" />
              </Button>
            </div>

            {/* Post group */}
            {comment.postGroup && (
              <div className="flex items-center gap-2">
                {comment.postGroup.photo && (
                  <img
                    src={comment.postGroup.photo}
                    alt=""
                    className="size-5 rounded-full"
                    loading="lazy"
                  />
                )}
                <span className="font-monitoring-body text-xs font-semibold text-slate-200">
                  {comment.postGroup.name}
                </span>
              </div>
            )}

            {/* Post text */}
            {comment.postText && (
              <div
                className={cn(
                  'cursor-pointer whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300 transition-colors hover:text-white',
                  !isPostExpanded && 'line-clamp-4'
                )}
                onClick={handleTogglePostExpand}
              >
                {highlightKeywords(comment.postText, fromPost.length > 0 ? fromPost : all)}
              </div>
            )}

            {/* Post attachments */}
            {postAttachments.length > 0 && <CommentAttachments attachments={postAttachments} />}
          </div>
        )}

        {/* Comment text */}
        {shouldShowComment && (
          <div className="space-y-2">
            {fromComment.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {fromComment.map((kw) => (
                  <Badge
                    key={kw.id}
                    className="h-5 border-0 bg-amber-500/10 px-1.5 font-mono-accent text-[9px] text-amber-400"
                  >
                    {kw.word}
                  </Badge>
                ))}
              </div>
            )}
            <div
              className={cn(
                'cursor-pointer whitespace-pre-wrap break-words font-monitoring-body text-[15px] leading-relaxed text-white transition-colors hover:text-slate-100',
                !isCommentExpanded && 'line-clamp-4'
              )}
              onClick={handleToggleCommentExpand}
            >
              {highlightKeywords(comment.text, fromComment.length > 0 ? fromComment : all)}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant={comment.isRead ? 'ghost' : 'default'}
            size="sm"
            onClick={handleToggleRead}
            className={cn(
              'h-8 gap-2 px-3 font-mono-accent text-xs font-medium transition-all',
              comment.isRead
                ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40'
            )}
          >
            {comment.isRead ? (
              <>
                <Eye className="size-3.5" />
                Прочитано
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                Отметить
              </>
            )}
          </Button>

          {onAddToWatchlist && (
            <Button
              variant="ghost"
              size="sm"
              disabled={comment.isWatchlisted || Boolean(isWatchlistLoading)}
              onClick={handleAddToWatchlist}
              className={cn(
                'h-8 gap-2 px-3 font-mono-accent text-xs font-medium',
                comment.isWatchlisted
                  ? 'text-slate-500 opacity-70'
                  : 'text-slate-400 hover:bg-white/5 hover:text-cyan-400'
              )}
            >
              {isWatchlistLoading ? (
                <Spinner className="size-3.5" />
              ) : (
                <BookmarkPlus className={cn('size-3.5', comment.isWatchlisted && 'fill-current')} />
              )}
              {comment.isWatchlisted ? 'В списке' : 'На карандаш'}
            </Button>
          )}
        </div>

        {/* Comment thread */}
        <CommentThread comment={comment} keywords={all} maxDepth={3} defaultExpanded={false} />
      </div>

      {/* Post preview modal - lazy loaded */}
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
            keywords={fromPost.length > 0 ? fromPost : all}
            onClose={handleCloseModal}
          />
        </Suspense>
      )}
    </div>
  )
})

export default CommentCard

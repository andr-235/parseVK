import { memo, useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { Comment, Keyword } from '@/types'
import { highlightKeywords } from '@/modules/comments/utils/highlightKeywords'
import { CommentAttachments } from './CommentAttachments'
import CommentCard from './CommentCard'
import { normalizeForKeywordMatch } from '@/modules/comments/utils/keywordMatching'
import { cn } from '@/shared/utils'

interface PostGroupCardProps {
  postText?: string | null
  postAttachments?: unknown | null
  postGroup?: {
    name: string
    photo: string | null
  } | null
  comments: Array<{
    comment: Comment
    matchedKeywords: Keyword[]
    index: number
  }>
  toggleReadStatus: (id: number) => Promise<void>
  onAddToWatchlist?: (commentId: number) => void
  watchlistPending?: Record<number, boolean>
  showKeywordComments?: boolean
  showKeywordPosts?: boolean
}

export const PostGroupCard = memo(function PostGroupCard({
  postText,
  postAttachments,
  postGroup,
  comments,
  toggleReadStatus,
  onAddToWatchlist,
  watchlistPending,
  showKeywordComments,
  showKeywordPosts,
}: PostGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isPostTextExpanded, setIsPostTextExpanded] = useState(false)

  // Memoized handlers (rerender optimization)
  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleTogglePostText = useCallback(() => {
    setIsPostTextExpanded((prev) => !prev)
  }, [])

  const postKeywords = useMemo(() => {
    if (!postText) return []
    const allKeywords = comments.flatMap((c) => c.matchedKeywords)
    const uniqueKeywords = allKeywords.filter(
      (kw, index, array) => array.findIndex((item) => item.id === kw.id) === index
    )

    return uniqueKeywords.filter((kw) => {
      if (kw.source !== 'POST') return false
      const normalizedText = normalizeForKeywordMatch(postText)
      const normalizedKeyword = normalizeForKeywordMatch(kw.word)
      return normalizedText.includes(normalizedKeyword)
    })
  }, [comments, postText])

  const attachmentsList = useMemo(() => {
    if (!postAttachments || !Array.isArray(postAttachments)) return []
    return postAttachments
  }, [postAttachments])

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-slate-900/30 backdrop-blur-sm">
      {/* Post Header/Content */}
      <div className="border-b border-white/5 bg-slate-800/30 p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {postGroup?.photo && (
              <img
                src={postGroup.photo}
                alt=""
                className="size-6 rounded-full border border-white/10"
                loading="lazy"
              />
            )}
            <span className="font-monitoring-display text-sm font-semibold text-white">
              {postGroup?.name || 'Группа'}
            </span>
            <Badge
              variant="outline"
              className="h-5 border-white/10 bg-slate-800/50 font-mono-accent text-[10px] text-slate-400"
            >
              Контекст поста
            </Badge>
            {postKeywords.length > 0 && (
              <div className="ml-2 flex flex-wrap gap-1">
                {postKeywords.map((kw) => (
                  <Badge
                    key={kw.id}
                    variant="secondary"
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
            size="sm"
            onClick={handleToggleExpand}
            className="size-8 p-0 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>

        {postText && (
          <div
            className={cn(
              'cursor-pointer whitespace-pre-wrap break-words font-monitoring-body text-sm leading-relaxed text-slate-200 transition-colors hover:text-white',
              !isPostTextExpanded && 'line-clamp-3'
            )}
            onClick={handleTogglePostText}
          >
            {highlightKeywords(postText, postKeywords)}
          </div>
        )}

        {attachmentsList.length > 0 && (
          <div className="mt-3">
            <CommentAttachments attachments={attachmentsList} />
          </div>
        )}
      </div>

      {/* Comments List */}
      {/* Show comments if:
          - showKeywordComments is true (enabled), OR
          - both filters are false (no filter mode - show all comments) */}
      {isExpanded &&
        (showKeywordComments === true ||
          (showKeywordComments === false && showKeywordPosts === false)) && (
          <div className="divide-y divide-white/5">
            <div className="bg-slate-900/50 px-4 py-2 font-mono-accent text-xs font-medium uppercase tracking-wider text-slate-400">
              Найденные комментарии ({comments.length})
            </div>
            {comments.map(({ comment, matchedKeywords, index }) => (
              <CommentCard
                key={`post-group-${comment.id}-${index}`}
                comment={comment}
                index={index}
                matchedKeywords={matchedKeywords}
                toggleReadStatus={toggleReadStatus}
                onAddToWatchlist={onAddToWatchlist}
                isWatchlistLoading={Boolean(watchlistPending?.[comment.id])}
                showKeywordComments={showKeywordComments}
                showKeywordPosts={showKeywordPosts}
                hidePostContext={true}
              />
            ))}
          </div>
        )}
    </div>
  )
})

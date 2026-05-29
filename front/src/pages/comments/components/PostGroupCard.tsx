import { memo, useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import type { Comment, Keyword } from '@/shared/types'
import { highlightKeywords } from '@/shared/utils/highlightKeywords'
import { CommentAttachments } from './CommentAttachments'
import CommentCard from './CommentCard'
import { normalizeForKeywordMatch } from '@/shared/utils/keywordMatching'
import { getMatchedKeywordLabel } from '@/pages/comments/utils/getMatchedKeywordLabel'
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
  onCategoryClick?: (category: string) => void
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
  onCategoryClick,
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
      const candidateForms = Array.isArray(kw.forms) && kw.forms.length > 0 ? kw.forms : [kw.word]

      return candidateForms.some((form) => {
        const normalizedKeyword = normalizeForKeywordMatch(form)
        return normalizedKeyword.length > 0 && normalizedText.includes(normalizedKeyword)
      })
    })
  }, [comments, postText])

  const attachmentsList = useMemo(() => {
    if (!postAttachments || !Array.isArray(postAttachments)) return []
    return postAttachments
  }, [postAttachments])

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-border/60 bg-background-secondary/30">
      {/* Post Header/Content */}
      <div className="border-b border-border/40 bg-background-primary/30 p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {postGroup?.photo && (
              <img
                src={postGroup.photo}
                alt=""
                className="size-6 rounded-full border border-border/60"
                loading="lazy"
              />
            )}
            <span className="font-monitoring-display text-sm font-semibold text-white">
              {postGroup?.name || 'Группа'}
            </span>
            <Badge
              variant="outline"
              className="h-5 border-border/60 bg-background-primary/50 font-mono-accent text-[10px] text-text-secondary"
            >
              Контекст поста
            </Badge>
            {postKeywords.length > 0 && (
              <div className="ml-2 flex flex-wrap gap-1">
                {postKeywords.map((kw) => (
                  <Badge
                    key={kw.id}
                    variant="secondary"
                    className="h-5 border-0 bg-accent-warning/10 px-1.5 font-mono-accent text-[9px] text-accent-warning"
                  >
                    {getMatchedKeywordLabel(kw, postText)}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleExpand}
            className="size-8 p-0 text-text-secondary transition-colors hover:bg-background-primary/40 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>

        {postText && (
          <div
            className={cn(
              'cursor-pointer whitespace-pre-wrap break-words font-monitoring-body text-sm leading-relaxed text-text-primary transition-colors hover:text-white',
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
          <div className="divide-y divide-border/40">
            <div className="bg-background-secondary/50 px-4 py-2 font-mono-accent text-xs font-medium uppercase tracking-wider text-text-secondary">
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
                onCategoryClick={onCategoryClick}
              />
            ))}
          </div>
        )}
    </div>
  )
})

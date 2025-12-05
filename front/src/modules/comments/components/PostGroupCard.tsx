import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Comment, Keyword } from '@/types'
import { highlightKeywords } from '@/modules/comments/utils/highlightKeywords'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CommentAttachments } from './CommentAttachments'
import CommentCard from './CommentCard'
import { useState, useMemo } from 'react'
import { normalizeForKeywordMatch } from '@/modules/comments/utils/keywordMatching'
import { cn } from '@/lib/utils'

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

export function PostGroupCard({
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
    <div className="border border-border/40 rounded-xl overflow-hidden bg-card mb-4">
      {/* Post Header/Content */}
      <div className="p-4 bg-muted/10 border-b border-border/40">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            {postGroup?.photo && (
              <img src={postGroup.photo} alt="" className="w-6 h-6 rounded-full" />
            )}
            <span className="font-semibold text-sm">{postGroup?.name || 'Группа'}</span>
            <Badge variant="outline" className="text-[10px] h-5">
              Контекст поста
            </Badge>
            {postKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-2">
                {postKeywords.map((kw) => (
                  <Badge
                    key={kw.id}
                    variant="secondary"
                    className="h-5 px-1.5 text-[9px] bg-yellow-500/10 text-yellow-600 border-0"
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
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {postText && (
          <div
            className={cn(
              'text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words cursor-pointer hover:text-foreground transition-colors',
              !isPostTextExpanded && 'line-clamp-3'
            )}
            onClick={() => setIsPostTextExpanded(!isPostTextExpanded)}
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
            <div className="px-4 py-2 bg-muted/5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
}

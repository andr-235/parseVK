import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Comment, Keyword } from '@/types'
import { highlightKeywords } from '@/modules/comments/utils/highlightKeywords'
import { CheckCircle2, ExternalLink, BookmarkPlus, Eye } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { getAuthorInitials } from '@/modules/comments/utils/getAuthorInitials'
import { formatDateTime } from '@/modules/comments/utils/formatDateTime'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { normalizeForKeywordMatch } from '@/modules/comments/utils/keywordMatching'
import { CommentAttachments } from './CommentAttachments'

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

function CommentCard({
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

  // Helper to check if a keyword is actually present in the text
  const isKeywordInText = (text: string | undefined, keyword: Keyword) => {
    if (!text) return false
    const normalizedText = normalizeForKeywordMatch(text)
    const normalizedKeyword = normalizeForKeywordMatch(keyword.word)
    return normalizedText.includes(normalizedKeyword)
  }

  const keywordsFromPost = (matchedKeywords ?? [])
    .filter((kw) => kw.source === 'POST')
    .filter((keyword, index, array) => array.findIndex((item) => item.id === keyword.id) === index)
    .filter((kw) => isKeywordInText(comment.postText || undefined, kw))

  const keywordsFromComment = (matchedKeywords ?? [])
    .filter((kw) => kw.source !== 'POST')
    .filter((keyword, index, array) => array.findIndex((item) => item.id === keyword.id) === index)

  const allUniqueKeywords = [...keywordsFromPost, ...keywordsFromComment].filter(
    (keyword, index, array) => array.findIndex((item) => item.id === keyword.id) === index
  )

  const isFilterActive = showKeywordComments !== undefined || showKeywordPosts !== undefined

  const shouldShowPost = (!isFilterActive || showKeywordPosts === true) && !hidePostContext

  const shouldShowComment = !isFilterActive || showKeywordComments === true

  const postAttachments = useMemo(() => {
    if (!comment.postAttachments || !Array.isArray(comment.postAttachments)) {
      return []
    }
    return comment.postAttachments
  }, [comment.postAttachments])

  return (
    <div
      className={cn(
        'group relative flex gap-4 p-5 transition-all duration-200',
        'hover:bg-muted/30 border-b border-border/40 last:border-0',
        comment.isRead && 'opacity-75 hover:opacity-100'
      )}
    >
      {/* Левая колонка: Аватар */}
      <div className="shrink-0">
        <Avatar className="h-10 w-10 sm:h-11 sm:w-11 border border-border shadow-sm">
          {comment.authorAvatar ? (
            <AvatarImage src={comment.authorAvatar} alt={comment.author} />
          ) : null}
          <AvatarFallback className="bg-primary/5 text-primary font-semibold text-xs sm:text-sm">
            {getAuthorInitials(comment.author)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Правая колонка: Контент */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Хедер: Автор и мета */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {comment.authorUrl ? (
                <a
                  href={comment.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors"
                >
                  {comment.author}
                </a>
              ) : (
                <span className="text-sm sm:text-base font-bold text-foreground">
                  {comment.author}
                </span>
              )}

              {comment.authorId && (
                <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded font-mono">
                  ID: {comment.authorId}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <time
                dateTime={comment.publishedAt ?? comment.createdAt}
                className="hover:underline decoration-muted-foreground/30"
              >
                {formatDateTime(comment.publishedAt ?? comment.createdAt)}
              </time>
              {comment.isRead && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-green-600/80 dark:text-green-400/80 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Прочитано
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Кнопка меню действий (опционально, или основные действия сразу) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {comment.commentUrl && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      asChild
                    >
                      <a href={comment.commentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Открыть в VK</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Пост (Контекст) */}
        {shouldShowPost &&
          (comment.postText || comment.postGroup || postAttachments.length > 0) && (
            <div className="relative pl-4 border-l-[3px] border-primary/20 bg-muted/20 rounded-r-xl py-3 pr-3 space-y-3 my-2">
              {/* Label 'Context' */}
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 select-none">
                Контекст поста
                {keywordsFromPost.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {keywordsFromPost.map((kw) => (
                      <Badge
                        key={kw.id}
                        variant="secondary"
                        className="h-5 px-1.5 text-[9px] bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-0"
                      >
                        {kw.word}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Группа поста */}
              {comment.postGroup && (
                <div className="flex items-center gap-2">
                  {comment.postGroup.photo && (
                    <img src={comment.postGroup.photo} alt="" className="w-5 h-5 rounded-full" />
                  )}
                  <span className="text-xs font-semibold text-foreground/80">
                    {comment.postGroup.name}
                  </span>
                </div>
              )}

              {/* Текст поста (урезанный если длинный) */}
              {comment.postText && (
                <div
                  className={cn(
                    'text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words cursor-pointer hover:text-foreground transition-colors',
                    !isPostExpanded && 'line-clamp-4'
                  )}
                  onClick={() => setIsPostExpanded(!isPostExpanded)}
                >
                  {highlightKeywords(
                    comment.postText,
                    keywordsFromPost.length > 0 ? keywordsFromPost : allUniqueKeywords
                  )}
                  {!isPostExpanded && comment.postText.length > 200 && (
                    <span className="text-primary/70 ml-1 text-xs font-medium hover:underline">
                      ...показать полностью
                    </span>
                  )}
                </div>
              )}

              {/* Медиа поста */}
              {postAttachments.length > 0 && <CommentAttachments attachments={postAttachments} />}
            </div>
          )}

        {/* Текст комментария */}
        {shouldShowComment && (
          <div className="space-y-2">
            {keywordsFromComment.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mb-1">
                {keywordsFromComment.map((kw) => (
                  <Badge
                    key={kw.id}
                    variant="secondary"
                    className="h-5 px-1.5 text-[9px] bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-0"
                  >
                    {kw.word}
                  </Badge>
                ))}
              </div>
            )}
            <div
              className={cn(
                'text-[15px] leading-relaxed text-foreground whitespace-pre-wrap break-words font-normal cursor-pointer hover:text-foreground/90 transition-colors',
                !isCommentExpanded && 'line-clamp-4'
              )}
              onClick={() => setIsCommentExpanded(!isCommentExpanded)}
            >
              {highlightKeywords(
                comment.text,
                keywordsFromComment.length > 0 ? keywordsFromComment : allUniqueKeywords
              )}
              {!isCommentExpanded && comment.text.length > 200 && (
                <span className="text-primary/70 ml-1 text-xs font-medium hover:underline">
                  ...показать полностью
                </span>
              )}
            </div>
          </div>
        )}

        {/* Нижняя панель действий */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant={comment.isRead ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => void toggleReadStatus(comment.id)}
            className={cn(
              'h-8 gap-2 px-3 text-xs font-medium transition-all',
              comment.isRead
                ? 'text-muted-foreground hover:text-foreground'
                : 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
            )}
          >
            {comment.isRead ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                Прочитано
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Прочитать
              </>
            )}
          </Button>

          {onAddToWatchlist && (
            <Button
              variant="ghost"
              size="sm"
              disabled={comment.isWatchlisted || Boolean(isWatchlistLoading)}
              onClick={() => !comment.isWatchlisted && onAddToWatchlist(comment.id)}
              className={cn(
                'h-8 gap-2 px-3 text-xs font-medium',
                comment.isWatchlisted
                  ? 'text-muted-foreground opacity-70'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              )}
            >
              {isWatchlistLoading ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <BookmarkPlus
                  className={cn('h-3.5 w-3.5', comment.isWatchlisted && 'fill-current')}
                />
              )}
              {comment.isWatchlisted ? 'В списке' : 'На карандаш'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommentCard

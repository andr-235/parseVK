import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Comment, Keyword } from '@/types'
import { highlightKeywords } from '@/utils/highlightKeywords'
import { CheckCircle2, ExternalLink, BookmarkPlus, Video, Link as LinkIcon, Eye } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { getAuthorInitials } from '../utils/getAuthorInitials'
import { formatDateTime } from '../utils/formatDateTime'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { normalizeForKeywordMatch } from '@/utils/keywordMatching'

interface CommentCardProps {
  comment: Comment
  index: number
  toggleReadStatus: (id: number) => Promise<void>
  onAddToWatchlist?: (commentId: number) => void
  isWatchlistLoading?: boolean
  matchedKeywords?: Keyword[]
  showKeywordComments?: boolean
  showKeywordPosts?: boolean
}

function CommentCard({
  comment,
  toggleReadStatus,
  onAddToWatchlist,
  isWatchlistLoading,
  matchedKeywords,
  showKeywordComments,
  showKeywordPosts,
}: CommentCardProps) {
  const [isPostExpanded, setIsPostExpanded] = useState(false)

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
  
  const shouldShowPost = !isFilterActive 
    || showKeywordPosts === true
  
  const shouldShowComment = !isFilterActive
    || showKeywordComments === true

  const postAttachments = useMemo(() => {
    if (!comment.postAttachments || !Array.isArray(comment.postAttachments)) {
      return []
    }
    return comment.postAttachments
  }, [comment.postAttachments])

  const renderAttachment = (attachment: unknown) => {
    if (!attachment || typeof attachment !== 'object') return null

    const att = attachment as Record<string, unknown>
    const type = att.type as string

    if (type === 'photo') {
      const photo = att.photo as Record<string, unknown>
      const sizes = (photo?.sizes as Array<Record<string, unknown>>) || []
      const largestSize = sizes.reduce((max, size) => {
        const maxWidth = (max?.width as number) || 0
        const currentWidth = (size?.width as number) || 0
        return currentWidth > maxWidth ? size : max
      }, sizes[0] || {})
      const photoUrl = (largestSize?.url as string) || (photo?.photo_604 as string) || (photo?.photo_807 as string)
      const photoId = (photo?.id as number) || (photo?.pid as number)

      if (!photoUrl) return null

      return (
        <a
          key={`photo-${photoId || Math.random()}`}
          href={photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all hover:shadow-sm group/media"
        >
          <img
            src={photoUrl}
            alt="Фото из поста"
            className="w-full h-auto max-h-96 object-contain bg-muted/10"
            loading="lazy"
          />
        </a>
      )
    }

    if (type === 'video') {
      const video = att.video as Record<string, unknown>
      const videoId = (video?.id as number) || (video?.vid as number)
      const ownerId = (video?.owner_id as number) || (video?.oid as number)
      const accessKey = (video?.access_key as string) || ''
      const title = (video?.title as string) || 'Видео'
      const thumb = (video?.photo_320 as string) || (video?.photo_640 as string) || (video?.image as string)

      return (
        <div
          key={`video-${videoId || Math.random()}`}
          className="flex items-center gap-3 rounded-xl border border-border/40 p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
        >
          {thumb && (
            <div className="relative group/video shrink-0">
              <img
                src={thumb}
                alt={title}
                className="w-24 h-16 object-cover rounded-lg"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-black/10 transition-colors rounded-lg">
                <Video className="h-6 w-6 text-white drop-shadow-md" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="truncate">{title}</span>
            </div>
            {ownerId && videoId && (
              <a
                href={`https://vk.com/video${ownerId}_${videoId}${accessKey ? `_${accessKey}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1.5 transition-colors"
              >
                Смотреть видео
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )
    }

    if (type === 'link') {
      const link = att.link as Record<string, unknown>
      const url = (link?.url as string) || ''
      const title = (link?.title as string) || (link?.caption as string) || 'Ссылка'
      const description = (link?.description as string) || ''
      const photo = (link?.photo as Record<string, unknown>) || null
      const photoUrl = photo ? ((photo?.photo_604 as string) || (photo?.photo_807 as string)) : null

      if (!url) return null

      return (
        <a
          key={`link-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-xl border border-border/40 p-3 bg-muted/20 hover:bg-muted/30 hover:border-primary/30 transition-all"
        >
          {photoUrl ? (
             <img
              src={photoUrl}
              alt={title}
              className="w-20 h-20 object-cover rounded-lg shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <LinkIcon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="truncate">{title}</span>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
            )}
            <span className="text-[10px] text-muted-foreground/60 mt-1.5 block truncate">{url}</span>
          </div>
        </a>
      )
    }

    return null
  }

  return (
    <div className={cn(
      "group relative flex gap-4 p-5 transition-all duration-200",
      "hover:bg-muted/30 border-b border-border/40 last:border-0",
      comment.isRead && "opacity-75 hover:opacity-100"
    )}>
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
                  <span className="text-sm sm:text-base font-bold text-foreground">{comment.author}</span>
                )}
                
                 {comment.authorId && (
                    <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded font-mono">
                      ID: {comment.authorId}
                    </span>
                  )}
             </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <time dateTime={comment.publishedAt ?? comment.createdAt} className="hover:underline decoration-muted-foreground/30">
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
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
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
        {shouldShowPost && (comment.postText || comment.postGroup || postAttachments.length > 0) && (
          <div className="relative pl-4 border-l-[3px] border-primary/20 bg-muted/20 rounded-r-xl py-3 pr-3 space-y-3 my-2">
             {/* Label 'Context' */}
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 select-none">
               Контекст поста
               {keywordsFromPost.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {keywordsFromPost.map(kw => (
                        <Badge key={kw.id} variant="secondary" className="h-5 px-1.5 text-[9px] bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-0">
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
                   <span className="text-xs font-semibold text-foreground/80">{comment.postGroup.name}</span>
                </div>
            )}

            {/* Текст поста (урезанный если длинный) */}
            {comment.postText && (
                <div 
                  className={cn(
                    "text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words cursor-pointer hover:text-foreground transition-colors",
                    !isPostExpanded && "line-clamp-4"
                  )}
                  onClick={() => setIsPostExpanded(!isPostExpanded)}
                >
                   {highlightKeywords(comment.postText, keywordsFromPost.length > 0 ? keywordsFromPost : allUniqueKeywords)}
                   {!isPostExpanded && comment.postText.length > 200 && (
                      <span className="text-primary/70 ml-1 text-xs font-medium hover:underline">...показать полностью</span>
                   )}
                </div>
            )}
            
             {/* Медиа поста */}
             {postAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {/* Показываем только превью если много вложений, чтобы не засорять */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                      {postAttachments.map((attachment) => renderAttachment(attachment)).filter(Boolean)}
                   </div>
                </div>
             )}
          </div>
        )}

        {/* Текст комментария */}
        {shouldShowComment && (
           <div className="space-y-2">
              {keywordsFromComment.length > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="h-5 border-primary/30 text-primary bg-primary/5 text-[10px]">
                        Найдено {keywordsFromComment.length} ключей
                    </Badge>
                  </div>
              )}
              <div className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap break-words font-normal">
                {highlightKeywords(comment.text, keywordsFromComment.length > 0 ? keywordsFromComment : allUniqueKeywords)}
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
                "h-8 gap-2 px-3 text-xs font-medium transition-all",
                comment.isRead 
                  ? "text-muted-foreground hover:text-foreground" 
                  : "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
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
                      "h-8 gap-2 px-3 text-xs font-medium",
                      comment.isWatchlisted ? "text-muted-foreground opacity-70" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
               >
                  {isWatchlistLoading ? (
                      <Spinner className="h-3.5 w-3.5" />
                  ) : (
                      <BookmarkPlus className={cn("h-3.5 w-3.5", comment.isWatchlisted && "fill-current")} />
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

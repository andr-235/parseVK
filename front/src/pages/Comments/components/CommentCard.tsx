import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Comment, Keyword } from '@/types'
import { highlightKeywords } from '@/utils/highlightKeywords'
import { CheckCircle2, ExternalLink, MessageSquare, BookmarkPlus, FileText, Users, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { getAuthorInitials } from '../utils/getAuthorInitials'
import { formatDateTime } from '../utils/formatDateTime'
import { useMemo } from 'react'

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
  index,
  toggleReadStatus,
  onAddToWatchlist,
  isWatchlistLoading,
  matchedKeywords,
  showKeywordComments,
  showKeywordPosts,
}: CommentCardProps) {
  const uniqueMatchedKeywords = (matchedKeywords ?? []).filter(
    (keyword, index, array) => array.findIndex((item) => item.id === keyword.id) === index,
  )

  const keywordsFromPost = uniqueMatchedKeywords.filter((kw) => kw.source === 'POST')
  const keywordsFromComment = uniqueMatchedKeywords.filter((kw) => kw.source !== 'POST')

  // Определяем, что показывать:
  // - Если оба фильтра не выбраны (undefined) - показываем всё
  // - Если выбран только комментарий - показываем только комментарий
  // - Если выбран только пост - показываем только пост
  // - Если выбраны оба - показываем оба
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
          className="block rounded-lg overflow-hidden border border-border/60 hover:border-primary/50 transition-colors"
        >
          <img
            src={photoUrl}
            alt="Фото из поста"
            className="w-full h-auto max-h-96 object-contain"
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
          className="flex items-center gap-3 rounded-lg border border-border/60 p-3 bg-background-secondary/40"
        >
          {thumb && (
            <img
              src={thumb}
              alt={title}
              className="w-20 h-20 object-cover rounded"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Video className="h-4 w-4 shrink-0" />
              <span className="truncate">{title}</span>
            </div>
            {ownerId && videoId && (
              <a
                href={`https://vk.com/video${ownerId}_${videoId}${accessKey ? `_${accessKey}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-secondary hover:text-primary inline-flex items-center gap-1 mt-1"
              >
                Открыть видео
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
          className="flex items-start gap-3 rounded-lg border border-border/60 p-3 bg-background-secondary/40 hover:border-primary/50 transition-colors"
        >
          {photoUrl && (
            <img
              src={photoUrl}
              alt={title}
              className="w-20 h-20 object-cover rounded shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <LinkIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{title}</span>
            </div>
            {description && (
              <p className="text-xs text-text-secondary mt-1 line-clamp-2">{description}</p>
            )}
            <span className="text-xs text-text-secondary/60 mt-1 block truncate">{url}</span>
          </div>
        </a>
      )
    }

    return null
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="px-6 pb-6 pt-8 space-y-6">
        {/* Header с аватаром и мета-информацией */}
        <div className="flex items-start gap-4">
          {/* Аватар */}
          <Avatar className="h-12 w-12 border-2 border-muted">
            {comment.authorAvatar ? (
              <AvatarImage src={comment.authorAvatar} alt={comment.author} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getAuthorInitials(comment.author)}
            </AvatarFallback>
          </Avatar>

          {/* Автор и мета-информация */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-1">
              <div className="flex flex-col gap-1">
                {/* Имя автора */}
                {comment.authorUrl ? (
                  <a
                    href={comment.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-text-primary hover:text-primary transition-colors inline-flex items-center gap-1.5"
                  >
                    {comment.author}
                    <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                  </a>
                ) : (
                  <span className="text-base font-semibold text-text-primary">{comment.author}</span>
                )}

                {/* ID и дата */}
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  {comment.authorId && (
                    <>
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        ID: {comment.authorId}
                      </Badge>
                      <span className="text-text-secondary/50">•</span>
                    </>
                  )}
                  <time className="text-xs" dateTime={comment.publishedAt ?? comment.createdAt}>
                    {formatDateTime(comment.publishedAt ?? comment.createdAt)}
                  </time>
                </div>
              </div>

              {/* Номер комментария и статус */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-xs">
                  #{index + 1}
                </Badge>
                {comment.isRead && (
                  <Badge variant="default" className="text-xs bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Прочитано
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {shouldShowPost && <Separator />}

        {/* Текст поста */}
        {shouldShowPost && (comment.postText || comment.postGroup || postAttachments.length > 0) && (
          <>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-text-secondary/60">
                <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Пост
                  {keywordsFromPost.length > 0 && (
                    <>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {keywordsFromPost.length} ключ. слов
                      </Badge>
                      <span className="ml-2 text-xs normal-case text-text-secondary/80">
                        (ключевые слова из поста)
                      </span>
                    </>
                  )}
                </span>
              </div>

              {/* Группа */}
              {comment.postGroup && (
                <div className="flex items-center gap-2 pl-6">
                  <Users className="h-4 w-4 text-text-secondary/60 shrink-0" />
                  <div className="flex items-center gap-2">
                    {comment.postGroup.photo && (
                      <img
                        src={comment.postGroup.photo}
                        alt={comment.postGroup.name}
                        className="w-5 h-5 rounded-full"
                        loading="lazy"
                      />
                    )}
                    <span className="text-sm font-medium text-text-primary">
                      {comment.postGroup.name}
                    </span>
                    {comment.postGroup.screenName && (
                      <a
                        href={`https://vk.com/${comment.postGroup.screenName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-text-secondary hover:text-primary inline-flex items-center gap-1"
                      >
                        @{comment.postGroup.screenName}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Текст поста */}
              {comment.postText && (
                <div className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap break-words pl-6">
                  {highlightKeywords(comment.postText, keywordsFromPost.length > 0 ? keywordsFromPost : uniqueMatchedKeywords)}
                </div>
              )}

              {/* Медиа поста */}
              {postAttachments.length > 0 && (
                <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2 text-xs text-text-secondary/60">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Медиа из поста</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {postAttachments.map((attachment) => renderAttachment(attachment)).filter(Boolean)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {shouldShowPost && shouldShowComment && <Separator />}

        {/* Текст комментария */}
        {shouldShowComment && (
          <div className="space-y-3">
          <div className="flex items-start gap-2 text-text-secondary/60">
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Комментарий
              {keywordsFromComment.length > 0 && (
                <>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {keywordsFromComment.length} ключ. слов
                  </Badge>
                  <span className="ml-2 text-xs normal-case text-text-secondary/80">
                    (ключевые слова из комментария)
                  </span>
                </>
              )}
            </span>
          </div>
          <div className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap break-words pl-6">
            {highlightKeywords(comment.text, keywordsFromComment.length > 0 ? keywordsFromComment : uniqueMatchedKeywords)}
          </div>
        </div>
        )}

        <Separator />

        {/* Действия */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={comment.isRead ? 'outline' : 'default'}
            size="sm"
            onClick={() => {
              void toggleReadStatus(comment.id)
            }}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {comment.isRead ? 'Отметить непрочитанным' : 'Отметить прочитанным'}
          </Button>

          {onAddToWatchlist && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={comment.isWatchlisted || Boolean(isWatchlistLoading)}
              onClick={() => {
                if (!comment.isWatchlisted) {
                  onAddToWatchlist(comment.id)
                }
              }}
            >
              {isWatchlistLoading ? (
                <Spinner className="h-4 w-4" aria-hidden="true" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
              {comment.isWatchlisted ? 'В списке' : 'На карандаше'}
            </Button>
          )}

          {comment.commentUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
              onClick={() => {
                if (!comment.isRead) {
                  void toggleReadStatus(comment.id)
                }
              }}
            >
              <a
                href={comment.commentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Открыть в VK
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CommentCard

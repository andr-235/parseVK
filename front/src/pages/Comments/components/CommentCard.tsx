import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Comment, Keyword } from '@/types'
import { highlightKeywords } from '@/utils/highlightKeywords'
import { CheckCircle2, ExternalLink, MessageSquare, BookmarkPlus, FileText } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { getAuthorInitials } from '../utils/getAuthorInitials'
import { formatDateTime } from '../utils/formatDateTime'

interface CommentCardProps {
  comment: Comment
  index: number
  toggleReadStatus: (id: number) => Promise<void>
  onAddToWatchlist?: (commentId: number) => void
  isWatchlistLoading?: boolean
  matchedKeywords?: Keyword[]
}


function CommentCard({
  comment,
  index,
  toggleReadStatus,
  onAddToWatchlist,
  isWatchlistLoading,
  matchedKeywords,
}: CommentCardProps) {
  const uniqueMatchedKeywords = (matchedKeywords ?? []).filter(
    (keyword, index, array) => array.findIndex((item) => item.id === keyword.id) === index,
  )

  const keywordsFromPost = uniqueMatchedKeywords.filter((kw) => kw.source === 'POST')
  const keywordsFromComment = uniqueMatchedKeywords.filter((kw) => kw.source !== 'POST')

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

        <Separator />

        {/* Текст поста */}
        {comment.postText && (
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
              <div className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap break-words pl-6">
                {highlightKeywords(comment.postText, keywordsFromPost.length > 0 ? keywordsFromPost : uniqueMatchedKeywords)}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Текст комментария */}
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

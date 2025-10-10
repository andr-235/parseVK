import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Comment, Keyword } from '@/types'
import { highlightKeywords } from '@/utils/highlightKeywords'
import { CheckCircle2, ExternalLink, MessageSquare } from 'lucide-react'

interface CommentCardProps {
  comment: Comment
  index: number
  keywords: Keyword[]
  toggleReadStatus: (id: number) => void
}

const getAuthorInitials = (name: string): string => {
  const sanitized = name.replace(/^https?:\/\//, '')

  if (!sanitized.trim()) {
    return '—'
  }

  if (sanitized.startsWith('vk.com/id')) {
    return 'VK'
  }

  const parts = sanitized.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return sanitized.charAt(0).toUpperCase() || '—'
  }

  const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
  return initials || parts[0].charAt(0).toUpperCase() || '—'
}

const formatDateTime = (value: string): string => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CommentCard({ comment, index, keywords, toggleReadStatus }: CommentCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
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

        <Separator className="my-4" />

        {/* Текст комментария */}
        <div className="mb-4">
          <div className="flex items-start gap-2 text-text-secondary/60 mb-2">
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide">Комментарий</span>
          </div>
          <div className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap break-words pl-6">
            {highlightKeywords(comment.text, keywords)}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Действия */}
        <div className="flex items-center gap-2">
          <Button
            variant={comment.isRead ? 'outline' : 'default'}
            size="sm"
            onClick={() => toggleReadStatus(comment.id)}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {comment.isRead ? 'Отметить непрочитанным' : 'Отметить прочитанным'}
          </Button>

          {comment.commentUrl && (
            <Button
              variant="outline"
              size="sm"
              //onClick={() => window.open(comment.commentUrl, '_blank', 'noopener,noreferrer')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Открыть в VK
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CommentCard

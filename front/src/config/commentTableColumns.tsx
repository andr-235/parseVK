import { Button } from '../components/ui/button'
import { highlightKeywords } from '../utils/highlightKeywords'
import type { TableColumn, Comment, Keyword } from '../types'

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

  return date.toLocaleString('ru-RU')
}

export const getCommentTableColumns = (
  keywords: Keyword[],
  toggleReadStatus: (id: number) => Promise<void>
): TableColumn<Comment>[] => [
  {
    header: '№',
    key: 'index',
    render: (_item, index) => index + 1
  },
  {
    header: 'Автор',
    key: 'author',
    render: (item: Comment) => (
      <div className="comment-author">
        {item.authorAvatar ? (
          <img
            src={item.authorAvatar}
            alt={item.author}
            className="comment-author__avatar"
            loading="lazy"
          />
        ) : (
          <div className="comment-author__avatar comment-author__avatar--fallback">
            {getAuthorInitials(item.author)}
          </div>
        )}
        <div className="comment-author__info">
          {item.authorUrl ? (
            <a
              href={item.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="comment-author__name"
            >
              {item.author}
            </a>
          ) : (
            <span className="comment-author__name">{item.author}</span>
          )}
          {item.authorId && (
            <span className="comment-author__meta">id{item.authorId}</span>
          )}
        </div>
      </div>
    )
  },
  {
    header: 'Комментарий',
    key: 'text',
    render: (item: Comment) => highlightKeywords(item.text, keywords)
  },
  {
    header: 'Дата/время',
    key: 'publishedAt',
    render: (item: Comment) => formatDateTime(item.publishedAt ?? item.createdAt)
  },
  {
    header: 'Действия',
    key: 'actions',
    render: (item: Comment) => (
      <div className="comment-actions table-actions flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={item.isRead ? 'secondary' : 'default'}
          className="min-w-[220px]"
          onClick={() => {
            void toggleReadStatus(item.id)
          }}
        >
          {item.isRead ? 'Отметить непрочитанным' : 'Отметить прочитанным'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-w-[140px]"
          onClick={() => {
            if (!item.commentUrl) {
              return
            }

            window.open(item.commentUrl, '_blank', 'noopener,noreferrer')
          }}
          disabled={!item.commentUrl}
        >
          Открыть в VK
        </Button>
      </div>
    )
  }
]

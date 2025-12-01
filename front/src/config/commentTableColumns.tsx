import { Button } from '../components/ui/button'
import { highlightKeywords } from '../utils/highlightKeywords'
import { formatDateTime, getAuthorInitials } from './utils'
import type { TableColumn, Comment, Keyword } from '../types'

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
    render: (item: Comment) => {
      const avatarUrl = item.authorAvatar ?? undefined
      const authorUrl = item.authorUrl ?? undefined

      return (
        <div className="comment-author">
          {avatarUrl ? (
            <img
              src={avatarUrl}
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
            {authorUrl ? (
              <a
                href={authorUrl}
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
    }
  },
  {
    header: 'Комментарий',
    key: 'text',
    render: (item: Comment) => {
      const combinedText = item.postText
        ? `${item.postText}\n\n${item.text}`
        : item.text
      return highlightKeywords(combinedText, keywords)
    }
  },
  {
    header: 'Дата/время',
    key: 'publishedAt',
    render: (item: Comment) => formatDateTime(item.publishedAt ?? item.createdAt)
  },
  {
    header: 'Действия',
    key: 'actions',
    render: (item: Comment) => {
      const handleToggleRead = () => {
        void toggleReadStatus(item.id)
      }

      const handleOpenVk = () => {
        if (item.commentUrl) {
          window.open(item.commentUrl, '_blank', 'noopener,noreferrer')
        }
      }

      return (
        <div className="comment-actions table-actions flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={item.isRead ? 'secondary' : 'default'}
            className="min-w-[220px]"
            onClick={handleToggleRead}
          >
            {item.isRead ? 'Отметить непрочитанным' : 'Отметить прочитанным'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-w-[140px]"
            onClick={handleOpenVk}
            disabled={!item.commentUrl}
          >
            Открыть в VK
          </Button>
        </div>
      )
    }
  }
]

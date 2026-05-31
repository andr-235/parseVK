import { memo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { getAuthorInitials } from '@/shared/utils'

interface CommentAuthorRowProps {
  author: string
  authorUrl?: string | null
  authorAvatar?: string | null
}

export const CommentAuthorRow = memo(function CommentAuthorRow({
  author,
  authorUrl,
  authorAvatar,
}: CommentAuthorRowProps) {
  return (
    <div className="flex min-w-0 shrink-0 items-center gap-2 lg:w-48">
      <Avatar className="size-6 shrink-0 border border-border/60">
        {authorAvatar ? (
          <AvatarImage
            src={authorAvatar}
            alt={author}
            loading="lazy"
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="bg-accent-info/10 font-mono-accent text-[10px] font-semibold text-accent-info">
          {getAuthorInitials(author)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 truncate">
        {authorUrl ? (
          <a
            href={authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-monitoring-body text-sm font-medium text-text-light transition-colors hover:text-accent-info"
          >
            {author}
          </a>
        ) : (
          <span className="font-monitoring-body text-sm font-medium text-text-light">{author}</span>
        )}
      </div>
    </div>
  )
})

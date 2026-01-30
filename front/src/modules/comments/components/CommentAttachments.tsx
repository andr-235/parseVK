import { ExternalLink, Link as LinkIcon, Video } from 'lucide-react'
import {
  extractCommentAttachments,
  type CommentAttachment,
} from '@/modules/comments/utils/extractCommentAttachments'

interface CommentAttachmentsProps {
  attachments: unknown[]
}

export function CommentAttachments({ attachments }: CommentAttachmentsProps) {
  if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
    return null
  }

  const renderAttachment = (attachment: CommentAttachment, index: number) => {
    if (attachment.type === 'photo') {
      return (
        <a
          key={`photo-${attachment.id ?? attachment.url}-${index}`}
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-all hover:shadow-sm group/media"
        >
          <img
            src={attachment.url}
            alt="Фото из поста"
            className="w-full h-auto max-h-96 object-contain bg-muted/10"
            loading="lazy"
          />
        </a>
      )
    }

    if (attachment.type === 'video') {
      return (
        <div
          key={`video-${attachment.id ?? 'item'}-${index}`}
          className="flex items-center gap-3 rounded-xl border border-border/40 p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
        >
          {attachment.thumb && (
            <div className="relative group/video shrink-0">
              <img
                src={attachment.thumb}
                alt={attachment.title}
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
              <span className="truncate">{attachment.title}</span>
            </div>
            {attachment.ownerId && attachment.id && (
              <a
                href={`https://vk.com/video${attachment.ownerId}_${attachment.id}${
                  attachment.accessKey ? `_${attachment.accessKey}` : ''
                }`}
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

    return (
      <a
        key={`link-${attachment.url}-${index}`}
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 rounded-xl border border-border/40 p-3 bg-muted/20 hover:bg-muted/30 hover:border-primary/30 transition-all"
      >
        {attachment.photoUrl ? (
          <img
            src={attachment.photoUrl}
            alt={attachment.title}
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
            <span className="truncate">{attachment.title}</span>
          </div>
          {attachment.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {attachment.description}
            </p>
          )}
          <span className="text-[10px] text-muted-foreground/60 mt-1.5 block truncate">
            {attachment.url}
          </span>
        </div>
      </a>
    )
  }

  const normalizedAttachments = extractCommentAttachments(attachments)

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {normalizedAttachments.map((attachment, index) => renderAttachment(attachment, index))}
      </div>
    </div>
  )
}
